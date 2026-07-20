/**
 * @file src/module/party-resources.ts
 * handles the rendering and logic of the floating party resources bar.
 **/

import { ResourceConfig } from './resource-config.js';
import { ResourceViewer } from './resource-viewer.js';
import { post_change_to_chat } from './utils.js';

export class PartyResources extends ( foundry.applications.api.ApplicationV2 as any ) 
{
	static DEFAULT_OPTIONS = 
	{
		id: 'yugen-party-resources-bar',
		tag: 'div',
		window: 
		{
			frame: false,
			resizable: false
		},
		position: 
		{
			width: 'auto',
			height: 'auto'
		}
	};

	/**
	 * renders the context for the floating bar.
	 **/
	async _prepareContext( _options: any ): Promise<any> 
	{
		const scale = ( game as any ).settings.get( 'yugen-party', 'resources-scale' ) || 1.0;
		const opacity = ( game as any ).settings.get( 'yugen-party', 'resources-opacity' ) || 0.9;
		const offset_x = ( game as any ).settings.get( 'yugen-party', 'resources-offset-x' ) || 0;
		const offset_y = ( game as any ).settings.get( 'yugen-party', 'resources-offset-y' ) || 0;
		const minimized = ( game as any ).settings.get( 'yugen-party', 'resources-minimized' ) || false;
		const hide_ui = ( game as any ).settings.get( 'yugen-party', 'resources-hide-ui' ) || false;

		const is_gm = ( game as any ).user.isGM;
		let resources = ( game as any ).settings.get( 'yugen-party', 'resources' ) || [ ];
		if ( Array.isArray( resources ) && resources.length > 0 && Array.isArray( resources[ 0 ] ) ) 
		{
			resources = resources[ 0 ];
		}

		console.log( 'yugen-party | preparing context:', { scale, opacity, offset_x, offset_y, minimized, resources, is_gm, hide_ui } );

		return ( 
		{
			scale,
			opacity,
			offset_x,
			offset_y,
			minimized,
			is_gm,
			resources,
			hide_ui
		} );
	}

	/**
	 * builds the dynamic html layout.
	 **/
	_renderHTML( context: any ): Promise<string> 
	{
		const hide_ui = context.hide_ui;
		if ( hide_ui ) 
		{
			return Promise.resolve( '' );
		}

		const scale = context.scale;
		const opacity = context.opacity;
		const off_x = context.offset_x;
		const off_y = context.offset_y;
		const minimized = context.minimized;
		const is_gm = context.is_gm;
		const resources = context.resources;

		console.log( 'yugen-party | rendering HTML. minimized:', minimized, 'resources count:', resources.length, 'is_gm:', is_gm );

		/** position styles dynamically calculated **/
		const bar_style = `
			opacity: ${ opacity };
			transform: scale( ${ scale } );
			bottom: ${ 24 + off_y }px;
			left: ${ 24 + off_x }px;
		`;

		if ( minimized ) 
		{
			const html = `
				<div class="yugen-party-resources-root minimized" style="${ bar_style }">
					<div class="yugen-party-resources-bar">
						<button class="yugen-bar-toggle" data-action="expand" title="Expand Party Resources">
							<i class="fas fa-shopping-bag"></i>
						</button>
					</div>
				</div>
			`;
			return Promise.resolve( html );
		}

		const list_html = resources.map( ( res: any ) => 
		{
			const is_fa = res.icon.startsWith( 'fa' ) || res.icon.includes( ' ' );
			const icon_html = is_fa 
				? `<i class="${ res.icon }"></i>` 
				: `<img src="${ res.icon }" />`;

			const has_click_action = res.macroId || res.script;
			const clickable_class = has_click_action ? 'is-clickable' : '';

			return `
				<li class="yugen-resource-item ${ clickable_class }" data-id="${ res.id }">
					<div class="yugen-resource-icon-container" title="${ res.label }">
						${ icon_html }
					</div>
					<div class="yugen-resource-text-group">
						<span class="yugen-resource-label">${ res.label }</span>
						<span class="yugen-resource-value">${ res.value }</span>
					</div>
				</li>
			`;
		} ).join( '' );

		const html = `
			<div class="yugen-party-resources-root" style="${ bar_style }">
				<div class="yugen-party-resources-bar">
					<ul class="yugen-resource-list">
						${ list_html }
					</ul>
					<div class="yugen-bar-actions">
						<button class="yugen-bar-action-btn" data-action="view" title="${ ( game as any ).i18n.localize( 'yugen-party.viewer.view-all' ) }">
							<i class="fas fa-backpack"></i>
						</button>
						<button class="yugen-bar-toggle" data-action="minimize" title="Minimize">
							<i class="fas fa-chevron-down"></i>
						</button>
						${ is_gm ? `
						<button class="yugen-bar-action-btn" data-action="config" title="Configure Resources">
							<i class="fas fa-cog"></i>
						</button>
						` : '' }
					</div>
				</div>
			</div>
		`;

		return Promise.resolve( html );
	}

	/**
	 * replaces layout html and attaches action listeners.
	 **/
	_replaceHTML( result: any, content: any, options: any ): void 
	{
		console.log( 'yugen-party | replacing HTML. element:', !!this.element );
		content.innerHTML = result;

		/** view button **/
		content.querySelector( '[data-action="view"]' )?.addEventListener( 'click', ( ) => 
		{
			const container_id = ( game as any ).settings.get( 'yugen-party', 'resources-container-actor-id' );
			let sheet_doc = null;

			if ( container_id ) 
			{
				/** 1. search actor directory **/
				sheet_doc = ( game as any ).actors.get( container_id ) || ( game as any ).actors.getName( container_id );

				/** 2. search item directory (e.g. container item) **/
				if ( !sheet_doc ) 
				{
					sheet_doc = ( game as any ).items.get( container_id ) || ( game as any ).items.getName( container_id );
				}

				/** 3. search scene tokens **/
				if ( !sheet_doc && canvas.ready ) 
				{
					const token = ( canvas as any ).tokens.placeables.find( ( t: any ) => 
					{
						return t.name === container_id || t.id === container_id;
					} );

					if ( token ) 
					{
						sheet_doc = token.actor;
					}
				}
			}

			if ( sheet_doc ) 
			{
				try 
				{
					sheet_doc.sheet.render( 
					{
						force: true
					} );
				}
				catch ( e ) 
				{
					sheet_doc.sheet.render( true );
				}
			}
			else 
			{
				ResourceViewer.instance.render( 
				{
					force: true
				} );
			}
		} );

		/** minimize button **/
		content.querySelector( '[data-action="minimize"]' )?.addEventListener( 'click', async ( ) => 
		{
			await ( game as any ).settings.set( 'yugen-party', 'resources-minimized', true );
			this.render( );
		} );

		/** expand button **/
		content.querySelector( '[data-action="expand"]' )?.addEventListener( 'click', async ( ) => 
		{
			await ( game as any ).settings.set( 'yugen-party', 'resources-minimized', false );
			this.render( );
		} );

		/** config settings button (gm-only) **/
		content.querySelector( '[data-action="config"]' )?.addEventListener( 'click', ( ) => 
		{
			const config = new ResourceConfig( );
			config.render( 
			{
				force: true
			} );
		} );

		/** handle click actions on resource items **/
		content.querySelectorAll( '.yugen-resource-item' ).forEach( ( item: any ) => 
		{
			item.addEventListener( 'click', ( ) => 
			{
				const id = item.dataset.id;
				if ( id ) 
				{
					PartyResources.execute_click_action( id );
				}
			} );
		} );
	}

	/**
	 * executes the configured macro or custom script for a resource.
	 **/
	public static async execute_click_action( id: string ): Promise<void> 
	{
		let resources = ( game as any ).settings.get( 'yugen-party', 'resources' ) || [ ];
		if ( Array.isArray( resources ) && resources.length > 0 && Array.isArray( resources[ 0 ] ) ) 
		{
			resources = resources[ 0 ];
		}

		const res = resources.find( ( r: any ) => 
		{
			return r.id === id;
		} );

		if ( !res ) 
		{
			return;
		}

		/** 1. execute macro by id if configured **/
		if ( res.macroId ) 
		{
			const macro = ( game as any ).macros.get( res.macroId );
			if ( macro ) 
			{
				try 
				{
					macro.execute( );
				} 
				catch ( e ) 
				{
					console.error( 'yugen-party | error executing macro:', e );
				}
			}
		}
		/** 2. execute custom script if provided **/
		else if ( res.script ) 
		{
			try 
			{
				/** execute custom script within safe context **/
				const fn = new Function( 'resource', res.script );
				fn( res );
			} 
			catch ( e ) 
			{
				console.error( 'yugen-party | error executing custom script:', e );
			}
		}
	}
}
