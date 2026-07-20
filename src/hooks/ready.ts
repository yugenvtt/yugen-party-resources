/**
 * @file ready.ts
 * handles the foundry vtt ready hook.
 **/

import { PartyUI } from '../module/party-ui.js';
import { YugenPauseMenu } from '../module/pause-menu.js';
import { PartyResources } from '../module/party-resources.js';

export let party_ui : PartyUI;
export let pause_menu : YugenPauseMenu | null = null;
export let party_resources : PartyResources;

export function ready_hook( ) : void 
{
	/** logic to run when the game is ready **/
	Hooks.once( 'ready', ( ) => 
	{
		console.log( 'yugen-party | ready' );

		party_ui = new PartyUI( );
		
		/** render the party sidebar **/
		party_ui.render( true );

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

		/** check if game is already paused on load **/
		const is_custom_pause_enabled = ( game as any ).settings.get( 'yugen-party', 'enable-custom-pause' ) ?? true;
		if ( is_custom_pause_enabled && ( game as any ).paused ) 
		{
			document.body.classList.add( 'yugen-custom-paused' );
			pause_menu = new YugenPauseMenu( );
			const always_show = ( game as any ).settings.get( 'yugen-party', 'always-show-on-pause' ) ?? true;
			pause_menu.set_collapsed( !always_show );
			pause_menu.render( { force: true } );
		}
	} );

	/** toggle custom pause overlay when game pause state changes **/
	Hooks.on( 'pauseGame', ( paused : boolean ) => 
	{
		const is_custom_pause_enabled = ( game as any ).settings.get( 'yugen-party', 'enable-custom-pause' ) ?? true;
		if ( !is_custom_pause_enabled ) 
		{ 
			return; 
		}

		if ( paused ) 
		{
			document.body.classList.add( 'yugen-custom-paused' );
			if ( !pause_menu ) 
			{
				pause_menu = new YugenPauseMenu( );
			}
			const always_show = ( game as any ).settings.get( 'yugen-party', 'always-show-on-pause' ) ?? true;
			pause_menu.set_collapsed( !always_show );
			pause_menu.render( { force: true } );
		}
		else 
		{
			document.body.classList.remove( 'yugen-custom-paused' );
			if ( pause_menu ) 
			{
				pause_menu.close( );
			}
		}
	} );

	/** refresh sidebar when tokens change on the scene **/
	Hooks.on( 'canvasReady', ( ) => party_ui?.render( ) );
	Hooks.on( 'createToken', ( ) => party_ui?.render( ) );
	Hooks.on( 'deleteToken', ( ) => party_ui?.render( ) );
	Hooks.on( 'controlToken', ( ) => party_ui?.render( ) );
	
	/** refresh sidebar when actor data (like portrait or health) changes **/
	Hooks.on( 'updateActor', ( actor : any ) => 
	{
		if ( actor.type === 'character' ) 
		{
			party_ui?.render( );
		}
	} );

	/** refresh sidebar when active effects change **/
	Hooks.on( 'createActiveEffect', ( effect : any ) => 
	{
		if ( effect.parent instanceof Actor && effect.parent.type === 'character' ) 
		{
			party_ui?.render( );
		}
	} );

	Hooks.on( 'deleteActiveEffect', ( effect : any ) => 
	{
		if ( effect.parent instanceof Actor && effect.parent.type === 'character' ) 
		{
			party_ui?.render( );
		}
	} );

	Hooks.on( 'updateActiveEffect', ( effect : any ) => 
	{
		if ( effect.parent instanceof Actor && effect.parent.type === 'character' ) 
		{
			party_ui?.render( );
		}
	} );

	/** refresh when custom refresh hooks are called **/
	Hooks.on( 'yugen-party.refresh', ( ) => party_ui?.render( ) );
	Hooks.on( 'yugen-party.refresh-resources', ( ) => party_resources?.render( ) );

	/** refresh sidebar when combat starts, ends, or changes **/
	Hooks.on( 'combatStart', ( ) => party_ui?.render( ) );
	Hooks.on( 'deleteCombat', ( ) => party_ui?.render( ) );
	Hooks.on( 'updateCombat', ( ) => party_ui?.render( ) );

	/** show chat bubble when an actor speaks **/
	Hooks.on( 'createChatMessage', ( message : any ) => 
	{
		if ( !party_ui ) { return; }

		const settings = ( game as any ).settings;
		const enabled = settings.get( 'yugen-party', 'enable-chat-bubbles' );
		if ( !enabled ) { return; }

		/** 
		 * find the actor id. 
		 * we prioritize the speaker's actor id.
		 **/
		const speaker = message.speaker;
		let actor_id = speaker?.actor;

		/** fallback to token's actor if actor id is missing **/
		if ( !actor_id && speaker?.token ) 
		{
			const token = ( canvas as any ).tokens?.get( speaker.token );
			actor_id = token?.actor?.id;
		}

		if ( !actor_id ) { return; }

		const only_chat = settings.get( 'yugen-party', 'show-only-chat' );
		if ( only_chat ) 
		{
			/** 
			 * foundry v14 uses 'style' (previously 'type').
			 * 0: OTHER, 1: OOC, 2: IC, 3: EMOTE, 4: WHISPER, 5: ROLL
			 **/
			const style = message.style ?? message.type;
			
			/** only allow OOC, IC, EMOTE, WHISPER **/
			const is_regular_chat = [ 1, 2, 3, 4 ].includes( style );
			if ( !is_regular_chat ) { return; }

			/** extra safety: exclude messages with rolls or item flags **/
			const has_rolls = ( message.rolls?.length > 0 ) || !!message.roll;
			const has_item_flags = !!message.flags?.dnd5e?.itemData || !!message.flags?.dnd5e?.item || !!message.flags?.pf2e?.item || !!message.flags?.pf2e?.origin;

			if ( has_rolls || has_item_flags ) { return; }
		}

		/** 
		 * get content and strip html.
		 **/
		const content = message.content;
		if ( typeof content !== 'string' ) { return; }

		const doc = ( new DOMParser( ) ).parseFromString( content, 'text/html' );
		const plain_text = doc.body.textContent || "";

		/** only show if there is actual text **/
		if ( plain_text.trim( ) ) 
		{
			party_ui.show_bubble( actor_id, plain_text.trim( ) );
		}
	} );
}
