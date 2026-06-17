/**
 * @file src/hooks/init.ts
 * handles the foundry vtt init hook.
 **/

export function init_hook( ) : void 
{
	/** register settings and other early initialization logic **/
	Hooks.once( 'init', ( ) => 
	{
		console.log( 'yugen-party-resources | initializing' );

		/** cache bust stylesheet **/
		( globalThis as any ).yugen_utils.cache_bust_css( 'yugen-party-resources' );

		/** register hide ui setting **/
		( game as any ).settings.register( 'yugen-party-resources', 'hide-ui', 
		{
			name: 'yugen-party-resources.settings.hide-ui.name',
			hint: 'yugen-party-resources.settings.hide-ui.hint',
			scope: 'client',
			config: true,
			type: Boolean,
			default: false,
			onChange: ( ) => 
			{
				( Hooks as any ).call( 'yugen-party-resources.refresh' );
			}
		} );

		/** register ui opacity setting **/
		( game as any ).settings.register( 'yugen-party-resources', 'ui-opacity', 
		{
			name: 'yugen-party-resources.settings.ui-opacity.name',
			hint: 'yugen-party-resources.settings.ui-opacity.hint',
			scope: 'client',
			config: true,
			type: Number,
			range: 
			{
				min: 0.1,
				max: 1.0,
				step: 0.05
			},
			default: 0.9,
			onChange: ( ) => 
			{
				( Hooks as any ).call( 'yugen-party-resources.refresh' );
			}
		} );

		/** register ui scale setting **/
		( game as any ).settings.register( 'yugen-party-resources', 'ui-scale', 
		{
			name: 'yugen-party-resources.settings.ui-scale.name',
			hint: 'yugen-party-resources.settings.ui-scale.hint',
			scope: 'client',
			config: true,
			type: Number,
			range: 
			{
				min: 0.5,
				max: 2.0,
				step: 0.1
			},
			default: 1.0,
			onChange: ( ) => 
			{
				( Hooks as any ).call( 'yugen-party-resources.refresh' );
			}
		} );

		/** register horizontal offset x setting **/
		( game as any ).settings.register( 'yugen-party-resources', 'ui-offset-x', 
		{
			name: 'yugen-party-resources.settings.ui-offset-x.name',
			hint: 'yugen-party-resources.settings.ui-offset-x.hint',
			scope: 'client',
			config: true,
			type: Number,
			default: 0,
			onChange: ( ) => 
			{
				( Hooks as any ).call( 'yugen-party-resources.refresh' );
			}
		} );

		/** register vertical offset y setting **/
		( game as any ).settings.register( 'yugen-party-resources', 'ui-offset-y', 
		{
			name: 'yugen-party-resources.settings.ui-offset-y.name',
			hint: 'yugen-party-resources.settings.ui-offset-y.hint',
			scope: 'client',
			config: true,
			type: Number,
			default: 0,
			onChange: ( ) => 
			{
				( Hooks as any ).call( 'yugen-party-resources.refresh' );
			}
		} );

		/** register hidden minimized setting **/
		( game as any ).settings.register( 'yugen-party-resources', 'minimized', 
		{
			scope: 'client',
			config: false,
			type: Boolean,
			default: false
		} );

		/** register hidden resources array setting **/
		( game as any ).settings.register( 'yugen-party-resources', 'resources', 
		{
			scope: 'world',
			config: false,
			type: Object,
			default: 
			[
				{
					id: 'gold',
					label: 'Gold Coins',
					value: 0,
					icon: 'fas fa-coins'
				},
				{
					id: 'rations',
					label: 'Rations',
					value: 0,
					icon: 'fas fa-utensils'
				}
			],
			onChange: ( ) => 
			{
				( Hooks as any ).call( 'yugen-party-resources.refresh' );
			}
		} );
	} );
}
