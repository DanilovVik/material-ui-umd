
/// <reference path="../actions.ts"/>

namespace documentation {

  export namespace reducers {

    export const route = (state = {current: 'briefing'}, action) => {
      switch (action.type) {
        case RouteActions.Go:
          return Object.assign({}, {current: action.payload});
        default:
          return state;
      }
    }

  } // reducers

} // namespace documentation
