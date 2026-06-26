/**
 * @file src/module/resource-config.ts
 * provides a user interface for editing custom party resources.
 **/

import { post_change_to_chat } from './utils.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class ResourceConfig extends HandlebarsApplicationMixin( ApplicationV2 ) 
{
	private _resources: any[] = [ ];

	constructor( options: any = { } ) 
	{
		super( options );

		/** load deep copy of current resources from settings **/
		let current = ( game as any ).settings.get( 'yugen-party-resources', 'resources' ) || [ ];
		if ( Array.isArray( current ) && current.length > 0 && Array.isArray( current[ 0 ] ) ) 
		{
			current = current[ 0 ];
		}
		this._resources = ( foundry.utils as any ).duplicate( current );

		console.log( 'yugen-party-resources | ResourceConfig instantiated:', this._resources );
	}

	static override DEFAULT_OPTIONS = 
	{
		id: 'yugen-party-resources-config',
		tag: 'form',
		window: 
		{
			title: 'yugen-party-resources.config.title',
			icon: 'fas fa-sliders-h',
			resizable: true
		},
		position: 
		{
			width: 560,
			height: 'auto' as const
		}
	};

	/**
	 * returns the localized window title.
	 **/
	override get title( ): string 
	{
		return ( game as any ).i18n.localize( 'yugen-party-resources.config.title' );
	}

	static override PARTS = 
	{
		config: 
		{
			template: 'modules/yugen-party-resources/templates/resource-config.hbs'
		}
	};

	/**
	 * prepares layout context for handlebars templates.
	 **/
	override async _prepareContext( _options: any ): Promise<any> 
	{
		console.log( 'yugen-party-resources | ResourceConfig preparing context:', this._resources );
		const containerActorId = ( game as any ).settings.get( 'yugen-party-resources', 'container-actor-id' ) || '';
		return ( 
		{
			resources: this._resources,
			containerActorId: containerActorId
		} );
	}

	/**
	 * injects listeners and handles updates in the rendered form.
	 **/
	override _onRender( context: any, options: any ): void 
	{
		super._onRender( context, options );
		console.log( 'yugen-party-resources | ResourceConfig rendering. element:', !!this.element );

		/** handle addition of a new resource row **/
		this.element.querySelector( '[data-action="add"]' )?.addEventListener( 'click', ( ) => 
		{
			this._sync_from_dom( );
			this._resources.push( 
			{
				id: `res-${ Date.now( ) }`,
				label: '',
				icon: 'fas fa-box',
				value: 0,
				macroId: '',
				script: ''
			} );
			this.render( );
		} );

		/** handle deletion of an existing resource row **/
		this.element.querySelectorAll( '[data-action="delete"]' ).forEach( ( btn: any ) => 
		{
			btn.addEventListener( 'click', ( ) => 
			{
				this._sync_from_dom( );
				const index = parseInt( btn.dataset.index );
				if ( !isNaN( index ) ) 
				{
					this._resources.splice( index, 1 );
					this.render( );
				}
			} );
		} );

		/** handle edit button click to open action config sub-dialogue **/
		this.element.querySelectorAll( '[data-action="edit-action"]' ).forEach( ( btn: any ) => 
		{
			btn.addEventListener( 'click', ( event: Event ) => 
			{
				event.preventDefault( );
				this._sync_from_dom( );
				const index = parseInt( btn.dataset.index );
				if ( !isNaN( index ) ) 
				{
					const resource = this._resources[ index ];
					
					/** import dynamically to prevent circular dependencies **/
					import( './resource-action-config.js' ).then( ( { ResourceActionConfig } ) => 
					{
						const sub_dialog = new ResourceActionConfig( resource, ( macroId, script ) => 
						{
							this._resources[ index ].macroId = macroId;
							this._resources[ index ].script = script;
							this.render( );
						} );
						sub_dialog.render( 
						{
							force: true
						} );
					} );
				}
			} );
		} );

		/** handle file picker click **/
		const FilePickerClass = ( foundry.applications as any )?.apps?.FilePicker?.implementation || ( window as any ).FilePicker;
		this.element.querySelectorAll( '.yugen-file-picker-btn' ).forEach( ( btn: any ) => 
		{
			btn.addEventListener( 'click', ( event: Event ) => 
			{
				event.preventDefault( );
				const target_name = btn.dataset.target;
				if ( !target_name ) 
				{
					return;
				}

				const input = this.element.querySelector( `input[name="${ target_name }"]` ) as HTMLInputElement;
				if ( !input ) 
				{
					return;
				}

				/** browse the server file directory for images **/
				new FilePickerClass( 
				{
					type: 'image',
					field: input,
					current: input.value,
					button: btn,
					callback: ( path: string ) => 
					{
						input.value = path;
					}
				} ).browse( );
			} );
		} );

		/** submit listener to save adjustments **/
		this.element.addEventListener( 'submit', async ( event: Event ) => 
		{
			event.preventDefault( );
			this._sync_from_dom( );

			const old_resources = ( game as any ).settings.get( 'yugen-party-resources', 'resources' ) || [ ];

			/** update world setting database **/
			await ( game as any ).settings.set( 'yugen-party-resources', 'resources', this._resources );

			const container_input = this.element.querySelector( '[name="containerActorId"]' ) as HTMLInputElement;
			if ( container_input ) 
			{
				await ( game as any ).settings.set( 'yugen-party-resources', 'container-actor-id', container_input.value.trim( ) );
			}

			/** post created or edited resource changes to chat **/
			for ( const new_res of this._resources ) 
			{
				const old_res = old_resources.find( ( r: any ) => 
				{
					return r.id === new_res.id;
				} );

				if ( !old_res ) 
				{
					post_change_to_chat( new_res.label, 0, new_res.value, ( game as any ).user );
				}
				else if ( old_res.value !== new_res.value || old_res.label !== new_res.label ) 
				{
					post_change_to_chat( new_res.label, old_res.value, new_res.value, ( game as any ).user );
				}
			}

			/** post deleted resource updates **/
			for ( const old_res of old_resources ) 
			{
				const exists = this._resources.some( ( r: any ) => 
				{
					return r.id === old_res.id;
				} );

				if ( !exists ) 
				{
					post_change_to_chat( old_res.label, old_res.value, 0, ( game as any ).user );
				}
			}

			/** close window **/
			this.close( );
		} );
	}

	/**
	 * reads input values from the current HTML DOM to update internal cache.
	 **/
	private _sync_from_dom( ): void 
	{
		const form = this.element as HTMLFormElement;
		if ( !form ) 
		{
			return;
		}

		for ( let i = 0; i < this._resources.length; i++ ) 
		{
			const label_input = form.querySelector( `[name="label-${ i }"]` ) as HTMLInputElement;
			const icon_input = form.querySelector( `[name="icon-${ i }"]` ) as HTMLInputElement;
			const value_input = form.querySelector( `[name="value-${ i }"]` ) as HTMLInputElement;
			const macro_select = form.querySelector( `[name="macroId-${ i }"]` ) as HTMLSelectElement;
			const script_textarea = form.querySelector( `[name="script-${ i }"]` ) as HTMLTextAreaElement;

			if ( label_input ) 
			{
				this._resources[ i ].label = label_input.value;
			}
			if ( icon_input ) 
			{
				this._resources[ i ].icon = icon_input.value;
			}
			if ( value_input ) 
			{
				this._resources[ i ].value = parseInt( value_input.value ) || 0;
			}
			if ( macro_select ) 
			{
				this._resources[ i ].macroId = macro_select.value;
			}
			if ( script_textarea ) 
			{
				this._resources[ i ].script = script_textarea.value;
			}
		}
	}
}
