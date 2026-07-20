/**
 * @file init.ts
 * handles the foundry vtt init hook.
 **/

export function init_hook( ) : void 
{
	/** register settings and other early initialization logic **/
	Hooks.once( 'init', ( ) => 
	{
		console.log( 'yugen-party | initializing' );

		/** cache bust stylesheets **/
		( globalThis as any ).yugen_utils.cache_bust_css( 'yugen-party' );

		/** register max pc count setting **/
		( game as any ).settings.register( 'yugen-party', 'max-pc-count', 
		{
			name: 'yugen-party.settings.max-pc-count.name',
			hint: 'yugen-party.settings.max-pc-count.hint',
			scope: 'world',
			config: true,
			type: Number,
			default: 4,
		} );

		/** register actor filter setting (world scope) **/
		( game as any ).settings.register( 'yugen-party', 'actor-filter', 
		{
			name: 'yugen-party.settings.actor-filter.name',
			hint: 'yugen-party.settings.actor-filter.hint',
			scope: 'world',
			config: true,
			type: String,
			default: '',
			onChange: ( ) => ( Hooks as any ).call( 'yugen-party.refresh' ),
		} );

		/** register background toggle (client scope) **/
		( game as any ).settings.register( 'yugen-party', 'show-background', 
		{
			name: 'yugen-party.settings.show-background.name',
			hint: 'yugen-party.settings.show-background.hint',
			scope: 'client',
			config: true,
			type: Boolean,
			default: false,
			onChange: ( ) => ( Hooks as any ).call( 'yugen-party.refresh' ),
		} );

		/** register theme style setting (client scope) **/
		( game as any ).settings.register( 'yugen-party', 'theme-style', 
		{
			name: 'yugen-party.settings.theme-style.name',
			hint: 'yugen-party.settings.theme-style.hint',
			scope: 'client',
			config: true,
			type: String,
			choices: {
				'default': 'yugen-party.settings.theme-style.default',
				'standard': 'yugen-party.settings.theme-style.standard',
				'persona': 'yugen-party.settings.theme-style.persona',
			},
			default: 'default',
			onChange: ( ) => ( Hooks as any ).call( 'yugen-party.refresh' ),
		} );

		/** register persona glow intensity (client scope) **/
		( game as any ).settings.register( 'yugen-party', 'persona-glow-strength', 
		{
			name: 'yugen-party.settings.persona-glow-strength.name',
			hint: 'yugen-party.settings.persona-glow-strength.hint',
			scope: 'client',
			config: true,
			type: Number,
			range: {
				min: 0,
				max: 40,
				step: 1,
			},
			default: 15,
			onChange: ( ) => ( Hooks as any ).call( 'yugen-party.refresh' ),
		} );

		/** register persona stagger toggle (client scope) **/
		( game as any ).settings.register( 'yugen-party', 'persona-stagger', 
		{
			name: 'yugen-party.settings.persona-stagger.name',
			hint: 'yugen-party.settings.persona-stagger.hint',
			scope: 'client',
			config: true,
			type: Boolean,
			default: true,
			onChange: ( ) => ( Hooks as any ).call( 'yugen-party.refresh' ),
		} );

		/** register sidebar alignment setting (client scope) **/
		( game as any ).settings.register( 'yugen-party', 'sidebar-alignment', 
		{
			name: 'yugen-party.settings.sidebar-alignment.name',
			hint: 'yugen-party.settings.sidebar-alignment.hint',
			scope: 'client',
			config: true,
			type: String,
			choices: {
				'left': 'yugen-party.settings.sidebar-alignment.left',
				'right': 'yugen-party.settings.sidebar-alignment.right',
				'top': 'yugen-party.settings.sidebar-alignment.top',
				'bottom': 'yugen-party.settings.sidebar-alignment.bottom',
			},
			default: 'left',
			onChange: ( ) => ( Hooks as any ).call( 'yugen-party.refresh' ),
		} );

		/** register x offset setting (client scope) **/
		( game as any ).settings.register( 'yugen-party', 'sidebar-offset-x', 
		{
			name: 'yugen-party.settings.sidebar-offset-x.name',
			hint: 'yugen-party.settings.sidebar-offset-x.hint',
			scope: 'client',
			config: true,
			type: Number,
			default: 0,
			onChange: ( ) => ( Hooks as any ).call( 'yugen-party.refresh' ),
		} );

		/** register y offset setting (client scope) **/
		( game as any ).settings.register( 'yugen-party', 'sidebar-offset-y', 
		{
			name: 'yugen-party.settings.sidebar-offset-y.name',
			hint: 'yugen-party.settings.sidebar-offset-y.hint',
			scope: 'client',
			config: true,
			type: Number,
			default: 0,
			onChange: ( ) => ( Hooks as any ).call( 'yugen-party.refresh' ),
		} );

		/** register collapsed setting (client scope) **/
		( game as any ).settings.register( 'yugen-party', 'sidebar-collapsed', 
		{
			name: 'yugen-party.settings.sidebar-collapsed.name',
			hint: 'yugen-party.settings.sidebar-collapsed.hint',
			scope: 'client',
			config: true,
			type: Boolean,
			default: false,
			onChange: ( ) => ( Hooks as any ).call( 'yugen-party.refresh' ),
		} );

		/** register yugen-modifiers integration setting (client scope) **/
		( game as any ).settings.register( 'yugen-party', 'yugen-modifiers-integration', 
		{
			name: 'yugen-party.settings.yugen-modifiers-integration.name',
			hint: 'yugen-party.settings.yugen-modifiers-integration.hint',
			scope: 'client',
			config: true,
			type: Boolean,
			default: true,
			onChange: ( ) => ( Hooks as any ).call( 'yugen-party.refresh' ),
		} );

		/** register hide in combat toggle (client scope) **/
		( game as any ).settings.register( 'yugen-party', 'hide-in-combat', 
		{
			name: 'yugen-party.settings.hide-in-combat.name',
			hint: 'yugen-party.settings.hide-in-combat.hint',
			scope: 'client',
			config: true,
			type: Boolean,
			default: false,
			onChange: ( ) => ( Hooks as any ).call( 'yugen-party.refresh' ),
		} );

		/** register chat bubble theme setting (client scope) **/
		( game as any ).settings.register( 'yugen-party', 'chat-bubble-theme', 
		{
			name: 'yugen-party.settings.chat-bubble-theme.name',
			hint: 'yugen-party.settings.chat-bubble-theme.hint',
			scope: 'client',
			config: true,
			type: String,
			choices: {
				'clean': 'yugen-party.settings.chat-bubble-theme.clean',
				'persona': 'yugen-party.settings.chat-bubble-theme.persona',
				'fantasy': 'yugen-party.settings.chat-bubble-theme.fantasy',
				'scifi': 'yugen-party.settings.chat-bubble-theme.scifi',
				'gothic': 'yugen-party.settings.chat-bubble-theme.gothic',
			},
			default: 'clean',
			onChange: ( ) => ( Hooks as any ).call( 'yugen-party.refresh' ),
		} );

		/** register hover details toggle **/
		( game as any ).settings.register( 'yugen-party', 'show-hover-details', 
		{
			name: 'yugen-party.settings.show-hover-details.name',
			hint: 'yugen-party.settings.show-hover-details.hint',
			scope: 'client',
			config: true,
			type: Boolean,
			default: true,
			onChange: ( ) => ( Hooks as any ).call( 'yugen-party.refresh' ),
		} );

		/** register hover hp toggle **/
		( game as any ).settings.register( 'yugen-party', 'show-hover-hp', 
		{
			name: 'yugen-party.settings.show-hover-hp.name',
			hint: 'yugen-party.settings.show-hover-hp.hint',
			scope: 'client',
			config: true,
			type: Boolean,
			default: true,
			onChange: ( ) => ( Hooks as any ).call( 'yugen-party.refresh' ),
		} );

		/** register hover ac toggle **/
		( game as any ).settings.register( 'yugen-party', 'show-hover-ac', 
		{
			name: 'yugen-party.settings.show-hover-ac.name',
			hint: 'yugen-party.settings.show-hover-ac.hint',
			scope: 'client',
			config: true,
			type: Boolean,
			default: false,
			onChange: ( ) => ( Hooks as any ).call( 'yugen-party.refresh' ),
		} );

		/** register ui scale setting (client-side) **/
		( game as any ).settings.register( 'yugen-party', 'sidebar-scale', 
		{
			name: 'yugen-party.settings.sidebar-scale.name',
			hint: 'yugen-party.settings.sidebar-scale.hint',
			scope: 'client',
			config: true,
			type: Number,
			range: {
				min: 0.5,
				max: 2.0,
				step: 0.1,
			},
			default: 1.0,
			onChange: ( ) => ( Hooks as any ).call( 'yugen-party.refresh' ),
		} );

		/** register hp estimate setting (gm-only, world scope) **/
		( game as any ).settings.register( 'yugen-party', 'hp-estimate', 
		{
			name: 'yugen-party.settings.hp-estimate.name',
			hint: 'yugen-party.settings.hp-estimate.hint',
			scope: 'world',
			config: true,
			type: Boolean,
			default: true,
			onChange: ( ) => ( Hooks as any ).call( 'yugen-party.refresh' ),
		} );

		/** hp estimate customization settings **/
		const hp_configs = [
			{ id: 'unharmed', label: 'Unharmed', color: '#2e7d32', threshold: 100 },
			{ id: 'fine', label: 'Fine', color: '#4caf50', threshold: 75 },
			{ id: 'scratched', label: 'Scratched', color: '#fbc02d', threshold: 50 },
			{ id: 'injured', label: 'Injured', color: '#f57c00', threshold: 25 },
			{ id: 'wounded', label: 'Badly Wounded', color: '#d32f2f', threshold: 0 },
			{ id: 'dead', label: 'Dead / Unconscious', color: '#000000', threshold: 0 }
		];

		for ( const config of hp_configs ) 
		{
			/** register label **/
			( game as any ).settings.register( 'yugen-party', `hp-label-${ config.id }`, 
			{
				name: `yugen-party.settings.hp-label-${ config.id }.name`,
				hint: `yugen-party.settings.hp-label-${ config.id }.hint`,
				scope: 'world',
				config: true,
				type: String,
				default: config.label,
				onChange: ( ) => ( Hooks as any ).call( 'yugen-party.refresh' ),
			} );

			/** register color **/
			( game as any ).settings.register( 'yugen-party', `hp-color-${ config.id }`, 
			{
				name: `yugen-party.settings.hp-color-${ config.id }.name`,
				hint: `yugen-party.settings.hp-color-${ config.id }.hint`,
				scope: 'world',
				config: true,
				type: String,
				default: config.color,
				onChange: ( ) => ( Hooks as any ).call( 'yugen-party.refresh' ),
			} );

			/** register threshold (only for intermediate states) **/
			if ( config.id !== 'unharmed' && config.id !== 'dead' && config.id !== 'wounded' ) 
			{
				( game as any ).settings.register( 'yugen-party', `hp-threshold-${ config.id }`, 
				{
					name: `yugen-party.settings.hp-threshold-${ config.id }.name`,
					hint: `yugen-party.settings.hp-threshold-${ config.id }.hint`,
					scope: 'world',
					config: true,
					type: Number,
					default: config.threshold,
					onChange: ( ) => ( Hooks as any ).call( 'yugen-party.refresh' ),
				} );
			}
		}

		( game as any ).settings.register( 'yugen-party', 'hide-conditions', 
		{
			name: 'yugen-party.settings.hide-conditions.name',
			hint: 'yugen-party.settings.hide-conditions.hint',
			scope: 'world',
			config: true,
			type: Boolean,
			default: false,
			onChange: ( ) => ( Hooks as any ).call( 'yugen-party.refresh' ),
		} );

		/** register highlight color setting (client scope) **/
		( game as any ).settings.register( 'yugen-party', 'highlight-color', 
		{
			name: 'yugen-party.settings.highlight-color.name',
			hint: 'yugen-party.settings.highlight-color.hint',
			scope: 'client',
			config: true,
			type: String,
			default: '#ffffff',
			onChange: ( ) => ( Hooks as any ).call( 'yugen-party.refresh' ),
		} );

		/** register chat bubble enable toggle (client scope) **/
		( game as any ).settings.register( 'yugen-party', 'enable-chat-bubbles', 
		{
			name: 'yugen-party.settings.enable-chat-bubbles.name',
			hint: 'yugen-party.settings.enable-chat-bubbles.hint',
			scope: 'client',
			config: true,
			type: Boolean,
			default: true,
		} );

		/** register show only chat toggle (client scope) **/
		( game as any ).settings.register( 'yugen-party', 'show-only-chat', 
		{
			name: 'yugen-party.settings.show-only-chat.name',
			hint: 'yugen-party.settings.show-only-chat.hint',
			scope: 'client',
			config: true,
			type: Boolean,
			default: true,
		} );

		/** register chat bubble duration (client scope) **/
		( game as any ).settings.register( 'yugen-party', 'chat-bubble-duration', 
		{
			name: 'yugen-party.settings.chat-bubble-duration.name',
			hint: 'yugen-party.settings.chat-bubble-duration.hint',
			scope: 'client',
			config: true,
			type: Number,
			range: {
				min: 1,
				max: 20,
				step: 1,
			},
			default: 5,
		} );

		/** register show inspiration setting (client scope) **/
		( game as any ).settings.register( 'yugen-party', 'show-inspiration', 
		{
			name: 'yugen-party.settings.show-inspiration.name',
			hint: 'yugen-party.settings.show-inspiration.hint',
			scope: 'client',
			config: true,
			type: Boolean,
			default: true,
			onChange: ( ) => ( Hooks as any ).call( 'yugen-party.refresh' ),
		} );

		/** register low health pulse setting (client scope) **/
		( game as any ).settings.register( 'yugen-party', 'low-health-pulse', 
		{
			name: 'yugen-party.settings.low-health-pulse.name',
			hint: 'yugen-party.settings.low-health-pulse.hint',
			scope: 'client',
			config: true,
			type: Boolean,
			default: true,
			onChange: ( ) => ( Hooks as any ).call( 'yugen-party.refresh' ),
		} );

		/** register enable custom pause setting (client scope) **/
		( game as any ).settings.register( 'yugen-party', 'enable-custom-pause', 
		{
			name: 'yugen-party.settings.enable-custom-pause.name',
			hint: 'yugen-party.settings.enable-custom-pause.hint',
			scope: 'client',
			config: true,
			type: Boolean,
			default: true,
		} );

		/** register always show on pause setting (client scope) **/
		( game as any ).settings.register( 'yugen-party', 'always-show-on-pause', 
		{
			name: 'yugen-party.settings.always-show-on-pause.name',
			hint: 'yugen-party.settings.always-show-on-pause.hint',
			scope: 'client',
			config: true,
			type: Boolean,
			default: true,
		} );

		/** register pause menu stats list setting (world scope) **/
		( game as any ).settings.register( 'yugen-party', 'pause-stats-list', 
		{
			name: 'yugen-party.settings.pause-stats-list.name',
			hint: 'yugen-party.settings.pause-stats-list.hint',
			scope: 'world',
			config: true,
			type: String,
			default: 'str,dex,con,int,wis,cha,hp',
		} );

		/*****************************************
		 * PARTY RESOURCES BAR SETTINGS
		 *****************************************/

		/** register hide ui setting **/
		( game as any ).settings.register( 'yugen-party', 'resources-hide-ui', 
		{
			name: 'yugen-party.settings.resources-hide-ui.name',
			hint: 'yugen-party.settings.resources-hide-ui.hint',
			scope: 'client',
			config: true,
			type: Boolean,
			default: false,
			onChange: ( ) => 
			{
				( Hooks as any ).call( 'yugen-party.refresh-resources' );
			}
		} );

		/** register ui opacity setting **/
		( game as any ).settings.register( 'yugen-party', 'resources-opacity', 
		{
			name: 'yugen-party.settings.resources-opacity.name',
			hint: 'yugen-party.settings.resources-opacity.hint',
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
				( Hooks as any ).call( 'yugen-party.refresh-resources' );
			}
		} );

		/** register ui scale setting **/
		( game as any ).settings.register( 'yugen-party', 'resources-scale', 
		{
			name: 'yugen-party.settings.resources-scale.name',
			hint: 'yugen-party.settings.resources-scale.hint',
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
				( Hooks as any ).call( 'yugen-party.refresh-resources' );
			}
		} );

		/** register horizontal offset x setting **/
		( game as any ).settings.register( 'yugen-party', 'resources-offset-x', 
		{
			name: 'yugen-party.settings.resources-offset-x.name',
			hint: 'yugen-party.settings.resources-offset-x.hint',
			scope: 'client',
			config: true,
			type: Number,
			default: 0,
			onChange: ( ) => 
			{
				( Hooks as any ).call( 'yugen-party.refresh-resources' );
			}
		} );

		/** register vertical offset y setting **/
		( game as any ).settings.register( 'yugen-party', 'resources-offset-y', 
		{
			name: 'yugen-party.settings.resources-offset-y.name',
			hint: 'yugen-party.settings.resources-offset-y.hint',
			scope: 'client',
			config: true,
			type: Number,
			default: 0,
			onChange: ( ) => 
			{
				( Hooks as any ).call( 'yugen-party.refresh-resources' );
			}
		} );

		/** register hidden minimized setting **/
		( game as any ).settings.register( 'yugen-party', 'resources-minimized', 
		{
			scope: 'client',
			config: false,
			type: Boolean,
			default: false
		} );

		/** register container actor ID or name setting **/
		( game as any ).settings.register( 'yugen-party', 'resources-container-actor-id', 
		{
			name: 'yugen-party.settings.resources-container-actor-id.name',
			hint: 'yugen-party.settings.resources-container-actor-id.hint',
			scope: 'world',
			config: true,
			type: String,
			default: '',
			onChange: ( ) => 
			{
				( Hooks as any ).call( 'yugen-party.refresh-resources' );
			}
		} );

		/** register hidden resources array setting **/
		( game as any ).settings.register( 'yugen-party', 'resources', 
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
				( Hooks as any ).call( 'yugen-party.refresh-resources' );
			}
		} );
	} );
}
