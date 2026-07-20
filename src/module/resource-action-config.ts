/**
 * @file src/module/resource-action-config.ts
 * provides a user interface for editing custom resource click actions.
 **/

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class ResourceActionConfig extends HandlebarsApplicationMixin( ApplicationV2 ) 
{
	private _resource: any;
	private _onSave: ( macroId: string, script: string ) => void;

	constructor( resource: any, onSave: ( macroId: string, script: string ) => void, options: any = { } ) 
	{
		super( options );
		this._resource = resource;
		this._onSave = onSave;
	}

	static override DEFAULT_OPTIONS = 
	{
		id: 'yugen-party-resources-action-config',
		classes: [ 
			'yugen-app', 
			'app' 
		],
		window: 
		{
			title: 'yugen-party',
			resizable: true
		},
		position: 
		{
			width: 420,
			height: 'auto' as const
		}
	};

	/**
	 * returns the localized window title.
	 **/
	override get title( ): string 
	{
		return 'yugen-party';
	}

	static override PARTS = 
	{
		actionConfig: 
		{
			template: 'modules/yugen-party/templates/resource-action-config.hbs'
		}
	};

	override async _prepareContext( _options: any ): Promise<any> 
	{
		const macros = ( game as any ).macros.contents.map( ( m: any ) => 
		{
			return ( 
			{
				id: m.id,
				name: m.name
			} );
		} );

		return ( 
		{
			resource: this._resource,
			macros: macros
		} );
	}

	override _onRender( context: any, options: any ): void 
	{
		super._onRender( context, options );

		const form = this.element.querySelector( 'form' ) || this.element;
		form.addEventListener( 'submit', ( event: Event ) => 
		{
			event.preventDefault( );
			const macro_select = this.element.querySelector( '[name="macroId"]' ) as HTMLSelectElement;
			const script_textarea = this.element.querySelector( '[name="script"]' ) as HTMLTextAreaElement;

			const macroId = macro_select ? macro_select.value : '';
			const script = script_textarea ? script_textarea.value : '';

			this._onSave( macroId, script );
			this.close( );
		} );
	}
}
