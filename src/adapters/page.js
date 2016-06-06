const defaultOptions = {};

export default function( options = {} ) {
  options = Object.assign({}, defaultOptions, options );

  const { page, engine } = options;

  return {
    route( path, handlers ) {
      page( path, ...handlers );
    },

    middleware( handlers ) {
      page( ...handlers );
    },

    adapt( handler ) {
      return function( context, next ) {
        if ( context.err && handler.length != 4 ) {
          return next();  // Skip all handlers that are not error handlers.
        }

        function dispatch() {
          return engine.dispatch.apply( engine, arguments );
        }

        function redirect( path ) {
          return page( path );
        }

        function completed() {}

        function _next( err ) {
          context.err = err;
          next();
        }

        return dispatch( state => {
          const req = {
            state,
            params: context.params
          };

          const res = {
            dispatch,
            redirect,
            completed
          };

          handler( req, res, _next );
        });
      };
    },

    navigate( url ) {
      page( url );
    }
  };
}
