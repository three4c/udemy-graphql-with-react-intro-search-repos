import React, { useState } from "react";
import { ApolloProvider } from "react-apollo";
import { Query } from "react-apollo";
import client from "./client";
import { SEARCH_REPOSITORIES } from "./graphql";

const PER_PAGE = 5;
const DEFAUTL_STATE = {
  first: PER_PAGE,
  after: null,
  last: null,
  before: null,
  query: "フロントエンドエンジニア"
};
const App = () => {
  const [state, setState] = useState(DEFAUTL_STATE);
  const { query, first, last, before, after } = state;

  const handleChange = event => {
    setState({
      ...DEFAUTL_STATE,
      query: event.target.value
    });
  };

  const handleSubmit = event => {
    event.preventDefault();
  };

  const goNext = search => {
    setState({
      ...state,
      first: PER_PAGE,
      after: search.pageInfo.endCursor,
      last: null,
      before: null
    });

    console.log(state);
  };

  return (
    <ApolloProvider client={client}>
      <form onSubmit={handleSubmit}>
        <input value={query} onChange={handleChange} />
      </form>
      <Query
        query={SEARCH_REPOSITORIES}
        variables={{ query, first, last, before, after }}
      >
        {({ loading, error, data }) => {
          if (loading) return "Loading...";
          if (error) return `Error! ${error.message}`;

          const search = data.search;
          const repositoryCount = search.repositoryCount;
          const repositoryUnit =
            repositoryCount === 1 ? "Repository" : "Repositories";
          const title = `GitHub Repositories Search Results - ${repositoryCount} ${repositoryUnit}`;

          return (
            <>
              <h2>{title}</h2>
              <ul>
                {search.edges.map(edge => {
                  const node = edge.node;

                  return (
                    <li key={node.id}>
                      <a
                        href={node.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {node.name}
                      </a>
                    </li>
                  );
                })}
              </ul>
              {search.pageInfo.hasNextPage === true ? (
                // 引数のある関数は() => void形にしないとレンダー時に発火する
                <button onClick={() => goNext(search)}>Next</button>
              ) : null}
            </>
          );
        }}
      </Query>
    </ApolloProvider>
  );
};

export default App;
