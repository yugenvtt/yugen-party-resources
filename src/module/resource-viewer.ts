/**
 * @file src/module/resource-viewer.ts
 * provides a read-only interface to view party resources.
 **/

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class ResourceViewer extends HandlebarsApplicationMixin( ApplicationV2 ) 
{
	private static _instance: ResourceViewer | null = null;

	constructor( options: any = { } ) 
	{
		super( options );

		/** refresh viewer when resources setting changes **/
		Hooks.on( 'yugen-party-resources.refresh', ( ) => 
		{
			if ( this.state === ( ApplicationV2 as any ).RENDER_STATES.RENDERED ) 
			{
				this.render( );
			}
		} );
	}

	public static get instance( ): ResourceViewer 
	{
		if ( !this._instance ) 
		{
			this._instance = new ResourceViewer( );
		}
		return this._instance;
	}

	static override DEFAULT_OPTIONS = 
	{
		id: 'yugen-party-resources-viewer',
		classes: [ 
			'yugen-party-resources-viewer-window', 
			'yugen-app', 
			'app' 
		],
		window: 
		{
			title: 'Party Resources',
			resizable: true
		},
		position: 
		{
			width: 350,
			height: 'auto' as const
		}
	};

	/**
	 * returns the localized window title.
	 **/
	override get title( ): string 
	{
		return 'Party Resources';
	}

	static override PARTS = 
	{
		viewer: 
		{
			template: 'modules/yugen-party-resources/templates/resource-viewer.hbs'
		}
	};

	override async _prepareContext( _options: any ): Promise<any> 
	{
		let resources = ( game as any ).settings.get( 'yugen-party-resources', 'resources' ) || [ ];
		if ( Array.isArray( resources ) && resources.length > 0 && Array.isArray( resources[ 0 ] ) ) 
		{
			resources = resources[ 0 ];
		}

		const parsed = resources.map( ( r: any ) => 
		{
			const is_fa = r.icon.startsWith( 'fa' ) || r.icon.includes( ' ' );
			const has_click_action = r.macroId || r.script;
			return ( 
			{
				...r,
				is_fa,
				has_click_action: !!has_click_action
			} );
		} );

		return ( 
		{
			resources: parsed
		} );
	}

	override _onRender( context: any, options: any ): void 
	{
		super._onRender( context, options );

		/** handle click actions on resource rows **/
		this.element.querySelectorAll( '.yugen-viewer-row' ).forEach( ( row: any ) => 
		{
			row.addEventListener( 'click', ( ) => 
			{
				const id = row.dataset.id;
				if ( id ) 
				{
					/** import PartyResources dynamically to avoid circular dependency **/
					import( './party-resources.js' ).then( ( { PartyResources } ) => 
					{
						PartyResources.execute_click_action( id );
					} );
				}
			} );
		} );
	}
}
