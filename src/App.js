import React, { useState } from "react";
import { ApolloProvider, Mutation, Query } from "react-apollo";
import client from "./client";
import { ADD_STAR, REMOVE_STAR, SEARCH_REPOSITORIES } from "./graphql";

const StarButton = props => {
  const { node, query, first, last, after, before } = props;
  const totalCount = props.node.stargazers.totalCount;
  const viewerHasStarred = node.viewerHasStarred;
  const starCount = totalCount === 1 ? "1 star" : `${totalCount} starts`;
  const StarStatus = ({ addOrRemoveStar }) => {
    return (
      <button
        onClick={() =>
          addOrRemoveStar({
            variables: { input: { starrableId: node.id } },
            update: (store, { data: { addStar, removeStar } }) => {
              const { starrable } = addStar || removeStar;
              const data = store.readQuery({
                query: SEARCH_REPOSITORIES,
                variables: { query, first, last, after, before }
              });
              const edges = data.search.edges;
              const newEdges = edges.map(edge => {
                if (edge.node.id === node.id) {
                  const totalCount = edge.node.stargazers.totalCount;
                  const diff = starrable.viewerHasStarred ? 1 : -1;
                  const newTotalCount = totalCount + diff;
                  edge.node.stargazers.totalCount = newTotalCount;
                }
                return edge;
              });
              data.search.edges = newEdges;
              store.writeQuery({ query: SEARCH_REPOSITORIES, data });
            }
          })
        }
      >
        {starCount} | {viewerHasStarred ? "starred" : "-"}
      </button>
    );
  };
  return (
    <Mutation mutation={viewerHasStarred ? REMOVE_STAR : ADD_STAR}>
      {addOrRemoveStar => <StarStatus addOrRemoveStar={addOrRemoveStar} />}
    </Mutation>
  );
};

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
  };

  const goPrevious = search => {
    setState({
      ...state,
      first: null,
      after: null,
      last: PER_PAGE,
      before: search.pageInfo.startCursor
    });
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
                      &nbsp;
                      <StarButton
                        node={node}
                        {...{ query, first, last, after, before }}
                      />
                    </li>
                  );
                })}
              </ul>
              {search.pageInfo.hasPreviousPage === true ? (
                <button onClick={() => goPrevious(search)}>Previous</button>
              ) : null}
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
