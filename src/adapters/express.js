import Immutable from 'immutable';
import Rx, { Observable } from 'rx-lite';
import RxExtras from 'rx-lite-extras';  // TODO: Receive Immutable and Rx as an injected dependency.

const defaultOptions = {
  initialize( req ) {
    return Observable.return( Immutable.Map() );
  }
};

export default function( options = {} ) {
  options = Object.assign({}, defaultOptions, options );

  const { app, Engine, config, initialize, render } = options;

  // Add middleware to express app.
  app.use( ( req, res, next ) => {
    initialize( req ).subscribe(
      initialState => {
        const engine = Engine( Object.assign({ Rx, Immutable, initialState }, config ) );

        function dispatch() {
          return engine.dispatch.apply( engine, arguments );
        }

        function completed() {
          engine.dispatch( state => {
            const { document, status } = render( state, dispatch );

            res.status( status ).send( document );
          });
        };

        engine.state(
          state => {},
          error => next( error )
        );

        Object.assign( req, { state: initialState });
        Object.assign( res, { dispatch, completed });

        next();
      },

      err => next( err )
    );
  });

  return {
    route( path, handlers ) {
      app.get( path, ...handlers );
    },

    middleware( handlers ) {
      app.use( ...handlers );
    },

    adapt( handler ) {
      return handler;
    },

    navigate( url ) {
      // NOOP
    }
  };
}
