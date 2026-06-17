/**
 * @file src/hooks/ready.ts
 * handles the foundry vtt ready hook.
 **/

import { PartyResources } from '../module/party-resources.js';

export let party_resources: PartyResources;

export function ready_hook( ) : void 
{
	/** logic to run when the game is ready **/
	Hooks.once( 'ready', ( ) => 
	{
		console.log( 'yugen-party-resources | ready' );

		party_resources = new PartyResources( );
		
		/** render the resources bar with v13/v14 compatibility **/
		try 
		{
			party_resources.render( 
			{
				force: true
			} );
		} 
		catch ( e ) 
		{
			party_resources.render( true );
		}
	} );

	/** refresh bar when custom refresh hook is called **/
	Hooks.on( 'yugen-party-resources.refresh', ( ) => 
	{
		if ( party_resources ) 
		{
			party_resources.render( );
		}
	} );
}
