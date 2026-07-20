/**
 * @file party-ui.ts
 * handles the rendering and logic of the party sidebar.
 **/

import { get_party_data_grouped_by_player } from './utils.js';

/**
 * manages the party sidebar ui using foundry v14 applicationv2
 **/
export class PartyUI extends ( foundry.applications.api.ApplicationV2 as any ) 
{
	/** track which actor is 'primary' for each player group (local state) **/
	private _primary_map: Map<string, string> = new Map( );

	/** track which actors have active chat bubbles (ttl and content mapping) **/
	private _bubble_map: Map<string, { text: string, expiry: number }> = new Map( );

	/**
	 * defines the application configuration
	 **/
	static DEFAULT_OPTIONS = 
	{
		id: 'yugen-party-sidebar',
		tag: 'aside',
		window: 
		{
			frame: false,
			resizable: false,
		},
		position: 
		{
			width: 'auto',
			height: 'auto',
		},
	};

	/**
	 * triggers a chat bubble for a specific actor
	 **/
	show_bubble( actor_id : string, text : string ) 
	{
		const duration = ( game as any ).settings.get( 'yugen-party', 'chat-bubble-duration' ) || 5;

		/** 
		 * auto-swap primary actor if the speaker is part of a tracked group.
		 * this ensures the chat bubble is actually visible.
		 **/
		const max_players = ( game as any ).settings.get( 'yugen-party', 'max-pc-count' );
		const player_groups = get_party_data_grouped_by_player( max_players );
		
		for ( const group of player_groups ) 
		{
			const has_actor = group.actors.some( ( a : Actor ) => a.id === actor_id );
			if ( has_actor ) 
			{
				this._primary_map.set( group.user_id, actor_id );
				break;
			}
		}

		/** 
		 * set expiry based on duration setting.
		 **/
		this._bubble_map.set( actor_id, { text, expiry: Date.now( ) + ( duration * 1000 ) } );
		this.render( );
		
		/** auto-clear after duration + small buffer to trigger a final re-render **/
		setTimeout( ( ) => 
		{
			if ( ( this._bubble_map.get( actor_id )?.expiry || 0 ) <= Date.now( ) ) 
			{
				this._bubble_map.delete( actor_id );
				this.render( );
			}
		}, ( duration * 1000 ) + 100 );
	}

	/**
	 * calculates hp status and color based on percentage and settings
	 **/
	_get_hp_status( percent : number, actor : Actor ) 
	{
		const settings = ( game as any ).settings;

		const t_fine = settings.get( 'yugen-party', 'hp-threshold-fine' );
		const t_scratched = settings.get( 'yugen-party', 'hp-threshold-scratched' );
		const t_injured = settings.get( 'yugen-party', 'hp-threshold-injured' );

		if ( percent >= 100 ) { return { text: settings.get( 'yugen-party', 'hp-label-unharmed' ), color: settings.get( 'yugen-party', 'hp-color-unharmed' ) }; }
		if ( percent >= t_fine ) { return { text: settings.get( 'yugen-party', 'hp-label-fine' ), color: settings.get( 'yugen-party', 'hp-color-fine' ) }; }
		if ( percent >= t_scratched ) { return { text: settings.get( 'yugen-party', 'hp-label-scratched' ), color: settings.get( 'yugen-party', 'hp-color-scratched' ) }; }
		if ( percent >= t_injured ) { return { text: settings.get( 'yugen-party', 'hp-label-injured' ), color: settings.get( 'yugen-party', 'hp-color-injured' ) }; }
		if ( percent > 0 ) { return { text: settings.get( 'yugen-party', 'hp-label-wounded' ), color: settings.get( 'yugen-party', 'hp-color-wounded' ) }; }
		
		const is_dead = ( actor as any ).system.attributes?.hp?.death > 0 || actor.effects.some( ( e : any ) => ( e as any ).name?.toLowerCase( ) === "dead" || ( e as any ).label?.toLowerCase( ) === "dead" );
		return { text: is_dead ? settings.get( 'yugen-party', 'hp-label-dead' ) : "Unconscious", color: settings.get( 'yugen-party', 'hp-color-dead' ), text_color: "#ffffff" };
	}

	/**
	 * renders the sidebar content
	 **/
	async _prepareContext( _options : any ) 
	{
		/** retrieve settings **/
		const max_players = ( game as any ).settings.get( 'yugen-party', 'max-pc-count' );
		const player_groups = get_party_data_grouped_by_player( max_players );
		
		/** retrieve settings **/
		const scale = ( game as any ).settings.get( 'yugen-party', 'sidebar-scale' ) || 1.0;
		/** retrieve settings **/
		const use_estimate = ( game as any ).settings.get( 'yugen-party', 'hp-estimate' );
		/** retrieve settings **/
		const hide_conditions = ( game as any ).settings.get( 'yugen-party', 'hide-conditions' );
		/** retrieve settings **/
		const highlight_color = ( game as any ).settings.get( 'yugen-party', 'highlight-color' );
		/** retrieve settings **/
		const show_hover = ( game as any ).settings.get( 'yugen-party', 'show-hover-details' );
		/** retrieve settings **/
		const show_hp = ( game as any ).settings.get( 'yugen-party', 'show-hover-hp' );
		/** retrieve settings **/
		const show_ac = ( game as any ).settings.get( 'yugen-party', 'show-hover-ac' );
		/** retrieve settings **/
		const show_bg = ( game as any ).settings.get( 'yugen-party', 'show-background' );
		/** retrieve settings **/
		const theme_style = ( game as any ).settings.get( 'yugen-party', 'theme-style' ) || 'default';
		const is_persona = theme_style === 'persona';
		/** retrieve settings **/
		const alignment = ( game as any ).settings.get( 'yugen-party', 'sidebar-alignment' ) || 'left';
		/** retrieve settings **/
		const glow_strength = ( game as any ).settings.get( 'yugen-party', 'persona-glow-strength' ) ?? 15;
		/** retrieve settings **/
		const use_stagger = ( game as any ).settings.get( 'yugen-party', 'persona-stagger' ) ?? true;
		/** retrieve settings **/
		const offset_x = ( game as any ).settings.get( 'yugen-party', 'sidebar-offset-x' ) ?? 0;
		/** retrieve settings **/
		const offset_y = ( game as any ).settings.get( 'yugen-party', 'sidebar-offset-y' ) ?? 0;
		/** retrieve settings **/
		const duration = ( game as any ).settings.get( 'yugen-party', 'chat-bubble-duration' ) || 5;
		/** retrieve settings **/
		const show_inspiration_setting = ( game as any ).settings.get( 'yugen-party', 'show-inspiration' );
		/** retrieve settings **/
		const low_health_pulse_setting = ( game as any ).settings.get( 'yugen-party', 'low-health-pulse' );
		/** retrieve settings **/
		const collapsed = ( game as any ).settings.get( 'yugen-party', 'sidebar-collapsed' ) ?? false;
		/** retrieve settings **/
		const hide_in_combat = ( game as any ).settings.get( 'yugen-party', 'hide-in-combat' ) ?? false;

		const is_hidden_by_combat = hide_in_combat && ( game as any ).combat?.started;
		
		/** retrieve controlled tokens **/
		const controlled_actor_ids = ( canvas as any ).tokens?.controlled?.map( ( t : any ) => t.actor?.id ) || [ ];

		/** 
		 * sync internal primary map with current control.
		 **/
		player_groups.forEach( group => 
		{
			const primary = group.actors.find( ( a : Actor ) => controlled_actor_ids.includes( a.id ) );
			if ( primary ) 
			{
				this._primary_map.set( group.user_id, primary.id );
			}
		} );

		const members = player_groups.map( group => 
		{
			const stored_id = this._primary_map.get( group.user_id );
			let primary_actor = group.actors.find( ( a : Actor ) => a.id === stored_id ) || group.actors[ 0 ];

			/** other actors in this slot **/
			const alternatives = group.actors.filter( ( a : Actor ) => a.id !== primary_actor.id );

			const hp = ( primary_actor as any ).system.attributes?.hp || { value: 0, max: 0, temp: 0 };
			const temp_hp = hp.temp || 0;
			const hp_percent = Math.clamp( ( hp.value / ( hp.max || 1 ) ) * 100, 0, 100 );
			const temp_percent = Math.clamp( ( temp_hp / ( hp.max || 1 ) ) * 100, 0, 100 );
			
			const status = this._get_hp_status( hp_percent, primary_actor );
			const ac = ( primary_actor as any ).system.attributes?.ac?.value || 0;

			/** retrieve active tokens on canvas **/
			const active_token = primary_actor.getActiveTokens( )[ 0 ];
			const token_img = active_token?.document?.texture?.src || 
							  primary_actor.prototypeToken?.texture?.src || 
							  primary_actor.img;

			/** detect inspiration / hero points **/
			const has_inspiration = show_inspiration_setting && (
				( primary_actor as any ).system.attributes?.inspiration || 
				( ( primary_actor as any ).system.resources?.heroPoints?.value > 0 )
			);

			/** check low health pulse **/
			const is_low_health = low_health_pulse_setting && hp_percent < 25 && hp.value > 0;

			/** construct detail string based on settings **/
			const details : string[] = [ ];
			if ( show_hp ) 
			{ 
				details.push( `${ hp.value }${ temp_hp > 0 ? ' (+' + temp_hp + ')' : '' } / ${ hp.max } HP` ); 
			}
			if ( show_ac ) 
			{ 
				details.push( `${ ac } AC` ); 
			}
			const detail_text = details.join( ' | ' );

			const bubble_data = this._bubble_map.get( primary_actor.id );

			const condition_overlays = this._get_active_conditions( primary_actor );

			return ( {
				id: primary_actor.id,
				user_id: group.user_id,
				name: primary_actor.name,
				img: primary_actor.img,
				token_img,
				is_active: controlled_actor_ids.includes( primary_actor.id ),
				/** check user ownership permission **/
				is_owner: primary_actor.testUserPermission( ( game as any ).user, "OWNER" ),
				bubble_text: bubble_data?.text,
				has_inspiration,
				is_low_health,
				condition_overlays,
				hp: {
					percent: hp_percent,
					temp_percent: temp_percent,
					temp_left: Math.min( hp_percent, 100 - temp_percent ),
					display: use_estimate ? status.text : `${ hp.value }${ temp_hp > 0 ? ' (+' + temp_hp + ')' : '' } / ${ hp.max }`,
					detail: detail_text,
					color: status.color,
					text_color: status.text_color || "#eee",
				},
				show_detail: show_hover && details.length > 0,
				/** retrieve active actor effects **/
				effects: hide_conditions ? [ ] : primary_actor.effects
					.filter( ( e : any ) => e.img && !e.disabled && !e.isSuppressed )
					.map( ( e : any ) => ( { img: e.img, name: e.name || e.label } ) ),
				alternatives: alternatives.map( ( a : Actor ) => ( { id: a.id, img: a.img, name: a.name } ) )
			} );
		} );

		return ( { scale, highlight_color, members, show_bg, is_persona, theme_style, alignment, glow_strength, use_stagger, offset_x, offset_y, duration, collapsed, is_hidden_by_combat } );
	}

	/**
	 * renders the html for the sidebar
	 **/
	/**
	 * renders the html for the sidebar
	 **/
	_renderHTML( context : any ) 
	{
		if ( context.members.length === 0 || context.is_hidden_by_combat ) 
		{ 
			return Promise.resolve( '' ); 
		}

		const scale = context.scale;
		const highlight = context.highlight_color;
		const is_persona = context.is_persona;
		const theme_style = context.theme_style || 'default';
		const off_x = context.offset_x;
		const off_y = context.offset_y;
		const duration = context.duration;
		const chat_bubble_theme = context.chat_bubble_theme || 'clean';

		const is_left = context.alignment === 'left';
		const is_right = context.alignment === 'right';
		const is_top = context.alignment === 'top';
		const is_bottom = context.alignment === 'bottom';
		const is_horizontal = is_top || is_bottom;

		/** dynamic background gradient based on alignment **/
		let background = '';
		if ( context.show_bg ) 
		{
			if ( is_left ) 
			{ 
				background = 'background: linear-gradient(to right, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0) 100%);'; 
			}
			else if ( is_right ) 
			{ 
				background = 'background: linear-gradient(to left, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0) 100%);'; 
			}
			else if ( is_top ) 
			{ 
				background = 'background: linear-gradient(to bottom, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0) 100%);'; 
			}
			else if ( is_bottom ) 
			{ 
				background = 'background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0) 100%);'; 
			}
		}

		/** calculate alignment styles **/
		let alignment_styles = '';
		if ( is_left ) 
		{ 
			alignment_styles = `left: 0; top: 0; bottom: 0; flex-direction: column; justify-content: center; align-items: flex-start; padding-left: ${ ( 15 * scale ) + off_x }px; margin-top: ${ off_y }px;`; 
		}
		else if ( is_right ) 
		{ 
			alignment_styles = `right: 0; top: 0; bottom: 0; flex-direction: column; justify-content: center; align-items: flex-end; padding-right: ${ ( 15 * scale ) - off_x }px; margin-top: ${ off_y }px;`; 
		}
		else if ( is_top ) 
		{ 
			alignment_styles = `top: 0; left: 0; right: 0; flex-direction: row; justify-content: center; align-items: flex-start; padding-top: ${ ( 15 * scale ) + off_y }px; margin-left: ${ off_x }px;`; 
		}
		else if ( is_bottom ) 
		{ 
			alignment_styles = `bottom: 0; left: 0; right: 0; flex-direction: row; justify-content: center; align-items: flex-end; padding-bottom: ${ ( 15 * scale ) - off_y }px; margin-left: ${ off_x }px;`; 
		}

		const sidebar_style = `
			position: fixed; z-index: 20000; pointer-events: none;
			display: flex;
			gap: ${ is_persona ? 30 * scale : 20 * scale }px;
			${ background }
			${ alignment_styles }
			--yugen-highlight: ${ highlight };
			--yugen-bubble-duration: ${ duration }s;
			--yugen-glow-strength: ${ context.glow_strength }px;
		`;

		const flow_direction = is_horizontal 
			? ( is_top ? 'column' : 'column-reverse' )
			: ( is_left ? 'row' : 'row-reverse' );

		const extras_align = is_horizontal ? 'center' : ( is_left ? 'flex-start' : 'flex-end' );
		const extras_flow = is_horizontal ? 'row' : 'column';

		/** collapse handle chevron icon **/
		const chevron_icon = is_left ? 'fa-chevron-right' :
			is_right ? 'fa-chevron-left' :
			is_top ? 'fa-chevron-down' : 'fa-chevron-up';

		/** fan container positioning **/
		let fan_style = '';
		if ( is_left ) 
		{ 
			fan_style = `left: ${ ( 140 * scale ) + off_x }px; top: 50%; transform: translateY(-50%) scale(${ scale });`; 
		}
		else if ( is_right ) 
		{ 
			fan_style = `right: ${ ( 140 * scale ) - off_x }px; top: 50%; transform: translateY(-50%) scale(${ scale });`; 
		}
		else if ( is_top ) 
		{ 
			fan_style = `top: ${ ( 140 * scale ) + off_y }px; left: 50%; transform: translateX(-50%) scale(${ scale });`; 
		}
		else if ( is_bottom ) 
		{ 
			fan_style = `bottom: ${ ( 140 * scale ) - off_y }px; left: 50%; transform: translateX(-50%) scale(${ scale });`; 
		}

		const html = `
			<div class="yugen-party-sidebar-root ${ theme_style === 'persona' ? 'persona-3-mode' : ( theme_style === 'default' ? 'default-theme-mode' : 'standard-theme-mode' ) } ${ context.alignment } ${ context.collapsed ? 'collapsed-mode' : '' }" 
				 style="${ sidebar_style }">
				${ context.collapsed ? `
					<div class="yugen-collapse-handle">
						<i class="fas ${ chevron_icon }"></i>
					</div>
				` : '' }
				${ context.members.map( ( member : any, index : number ) => {
					const portrait_size = 85 * scale;
					const icon_size = 20 * scale;
					const alt_size = 30 * scale;
					const border_color = member.is_active ? 'var(--yugen-highlight)' : ( is_persona ? '#eee' : '#6b5a3c' );
					
					/** arch style calculations for Default theme **/
					let arch_style = '';
					if ( theme_style === 'default' && context.members.length > 1 ) 
					{
						const N = context.members.length;
						const t = ( index - ( N - 1 ) / 2 ) / ( ( N - 1 ) / 2 || 1 );
						const displacement = 35 * scale * ( 1 - t * t );
						
						if ( is_left ) 
						{ 
							arch_style = `margin-left: ${ displacement }px;`; 
						}
						else if ( is_right ) 
						{ 
							arch_style = `margin-right: ${ displacement }px;`; 
						}
						else if ( is_top ) 
						{ 
							arch_style = `margin-top: ${ displacement }px;`; 
						}
						else if ( is_bottom ) 
						{ 
							arch_style = `margin-bottom: ${ displacement }px;`; 
						}
					}
					
					/** staggered offset for persona style **/
					const stagger = ( is_persona && context.use_stagger ) 
						? `margin-${ is_horizontal ? ( is_top ? 'top' : 'bottom' ) : ( is_left ? 'left' : 'right' ) }: ${ ( index * 15 ) * scale }px;` 
						: '';

					/** chat bubble element **/
					let bubble_style = '';
					if ( is_left ) 
					{ 
						bubble_style = `left: 100%; top: 20%; margin-left: ${ 10 * scale }px;`; 
					}
					else if ( is_right ) 
					{ 
						bubble_style = `right: 100%; top: 20%; margin-right: ${ 10 * scale }px;`; 
					}
					else if ( is_top ) 
					{ 
						bubble_style = `top: 100%; left: 50%; transform: translateX(-50%); margin-top: ${ 10 * scale }px;`; 
					}
					else if ( is_bottom ) 
					{ 
						bubble_style = `bottom: 100%; left: 50%; transform: translateX(-50%); margin-bottom: ${ 10 * scale }px;`; 
					}

					const chat_bubble = member.bubble_text ? `
						<div class="yugen-chat-bubble ${ chat_bubble_theme }" style="
							position: absolute; 
							${ bubble_style }
							z-index: 100;
							max-width: ${ 200 * scale }px;
							animation-duration: var(--yugen-bubble-duration);
						">
							${ member.bubble_text }
						</div>
					` : '';

					/** inspiration icon **/
					const inspiration_icon = member.has_inspiration ? `
						<div class="yugen-inspiration-icon" style="transform: scale(${ scale });">
							<i class="fas fa-star"></i>
						</div>
					` : '';

					/** condition overlays HTML **/
					const overlays_html = member.condition_overlays.map( ( cond : string ) => `
						<div class="yugen-condition-overlay ${ cond }"></div>
					` ).join( '' );

					if ( theme_style === 'default' ) 
					{
						return `
							<div class="yugen-default-portrait-wrapper ${ member.is_active ? 'active' : '' } ${ member.is_low_health ? 'yugen-low-health-pulse' : '' }" 
								 data-index="${ index }" 
								 data-actor-id="${ member.id }"
								 style="position: relative; pointer-events: all; ${ arch_style }">
								${ chat_bubble }
								${ inspiration_icon }
								
								<div class="yugen-default-portrait-pill">
									<div class="yugen-default-portrait-circle" style="background-image: url('${ member.token_img }');">
										${ overlays_html }
									</div>
									<div class="yugen-default-portrait-info">
										<span class="yugen-default-name">${ member.name }</span>
									</div>
									
									<div class="yugen-hp-container default-theme" style="
										position: absolute; bottom: 0; left: 0; right: 0; height: ${ 12 * scale }px;
										background: rgba(0, 0, 0, 0.85); border-top: 1px solid #333; overflow: hidden;
										display: flex; align-items: center; justify-content: center; z-index: 10;
									">
										<div class="yugen-hp-fill" style="position: absolute; left: 0; top: 0; bottom: 0; width: ${ member.hp.percent }%; background-color: ${ member.hp.color };"></div>
										${ member.hp.temp_percent > 0 ? `<div class="yugen-hp-fill temp" style="position: absolute; left: ${ member.hp.temp_left }%; top: 0; bottom: 0; width: ${ member.hp.temp_percent }%; z-index: 2;"></div>` : '' }
										<div class="yugen-hp-label status" style="position: relative; z-index: 12; font-size: ${ 8 * scale }px; color: ${ member.hp.text_color }; font-weight: bold; text-shadow: 1px 1px 2px black; line-height: ${ 12 * scale }px;">${ member.hp.display }</div>
										${ member.show_detail ? `<div class="yugen-hp-label detail" style="display: none; position: relative; z-index: 12; font-size: ${ 7 * scale }px; color: #fff; font-weight: bold; text-shadow: 1px 1px 2px black; line-height: ${ 12 * scale }px;">${ member.hp.detail }</div>` : '' }
									</div>
								</div>
							</div>
						`;
					}

					if ( is_persona ) 
					{
						/** mirror clip paths based on alignment **/
						const bg_clip = is_right ? 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)' : 'polygon(0% 0%, 85% 0%, 100% 100%, 15% 100%)';

						return `
							<div class="yugen-member-row persona" style="display: flex; flex-direction: ${ flow_direction }; align-items: center; gap: ${ 15 * scale }px; pointer-events: none; ${ stagger }">
								<div class="yugen-persona-card-wrapper ${ member.is_active ? 'active' : '' } ${ member.is_low_health ? 'yugen-low-health-pulse' : '' }" 
									 data-actor-id="${ member.id }"
									 style="position: relative; width: ${ 120 * scale }px; height: ${ 110 * scale }px; pointer-events: all; cursor: pointer;">
									${ chat_bubble }
									${ inspiration_icon }
									
									<div class="yugen-persona-card-border" style="
										position: absolute; bottom: 0; ${ is_left || is_horizontal ? 'left' : 'right' }: 0; width: 100%; height: 85%;
										background: ${ border_color };
										clip-path: ${ bg_clip };
										z-index: 1;
										transition: all 0.2s ease-out;
									">
										<div class="yugen-persona-card-inner" style="
											position: absolute; top: 3px; left: 3px; right: 3px; bottom: 3px;
											background: #15151c;
											clip-path: ${ bg_clip };
											z-index: 2;
											overflow: hidden;
										">
											<div class="yugen-persona-portrait-img" style="
												width: 100%; height: 100%;
												background-image: url('${ member.img }'); background-size: cover; background-position: center top;
												transition: transform 0.2s ease-out, filter 0.2s ease-out;
												position: relative;
											">
												${ overlays_html }
											</div>

											<div class="yugen-hp-container persona" style="
												position: absolute; bottom: 0; left: 0; right: 0; height: ${ 14 * scale }px;
												background: rgba(0,0,0,0.85); z-index: 10;
												border-top: 1px solid #333; overflow: hidden; pointer-events: none;
											">
												<div class="yugen-hp-fill" style="position: absolute; left: 0; top: 0; bottom: 0; width: ${ member.hp.percent }%; background-color: ${ member.hp.color };"></div>
												${ member.hp.temp_percent > 0 ? `<div class="yugen-hp-fill temp" style="position: absolute; left: ${ member.hp.temp_left }%; top: 0; bottom: 0; width: ${ member.hp.temp_percent }%; z-index: 2;"></div>` : '' }
												<div class="yugen-hp-label status" style="position: relative; z-index: 12; font-size: ${ 9 * scale }px; color: #fff; font-weight: bold; text-align: center; line-height: ${ 14 * scale }px;">${ member.hp.display }</div>
												${ member.show_detail ? `<div class="yugen-hp-label detail" style="display: none; position: relative; z-index: 12; font-size: ${ 8 * scale }px; color: #fff; font-weight: bold; text-align: center; line-height: ${ 14 * scale }px;">${ member.hp.detail }</div>` : '' }
											</div>
										</div>
									</div>

									<div class="yugen-persona-nameplate" style="
										position: absolute; top: 2px; ${ is_left || is_horizontal ? 'left: -5px;' : 'right: -5px;' }
										background: #000; color: #fff;
										border: 1px solid ${ member.is_active ? 'var(--yugen-highlight)' : '#eee' };
										padding: 2px 10px;
										font-weight: 900; font-size: ${ 12 * scale }px; font-style: italic; text-transform: uppercase;
										transform: skewX(${ is_left || is_horizontal ? '-15deg' : '15deg' });
										box-shadow: 3px 3px 0px rgba(0, 0, 0, 0.8);
										z-index: 15;
										transition: all 0.2s ease-out;
									">
										${ member.name }
									</div>
								</div>

								<div class="yugen-side-extras" style="display: flex; flex-direction: ${ extras_flow }; gap: 8px; align-items: ${ extras_align }; pointer-events: all;">
									${ member.alternatives.length > 0 ? `
										<div class="yugen-swap-list" style="display: flex; flex-direction: ${ is_horizontal ? 'row' : ( is_left ? 'row' : 'row-reverse' ) }; gap: 6px; align-items: center;">
											${ member.alternatives.map( ( alt : any ) => `
												<div class="yugen-swap-portrait persona" 
													 data-swap-id="${ alt.id }" 
													 data-user-id="${ member.user_id }"
													 title="Swap to ${ alt.name }"
													 style="
														width: ${ alt_size }px; height: ${ alt_size }px; 
														background-image: url('${ alt.img }'); background-size: cover; 
														border: 1px solid #eee; clip-path: polygon(${ is_left || is_horizontal ? '0% 0%, 90% 0%, 100% 100%, 10% 100%' : '10% 0%, 100% 0%, 90% 100%, 0% 100%' });
														cursor: pointer; background-color: #111;
													 "></div>
											` ).join( '' ) }
										</div>
									` : '' }
									
									<div class="yugen-effect-list" style="display: flex; flex-direction: ${ is_horizontal ? 'row' : ( is_left ? 'row' : 'row-reverse' ) }; flex-wrap: wrap; gap: 4px; max-width: 150px; pointer-events: none;">
										${ member.effects.map( ( e : any ) => `
											<div class="yugen-effect-icon" data-tooltip="${ e.name }" style="width: ${ icon_size }px; height: ${ icon_size }px; border: 1px solid #eee; background-color: rgba(0,0,0,0.8); overflow: hidden; pointer-events: all; transform: skewX(${ is_left || is_horizontal ? '10deg' : '-10deg' });">
												<img src="${ e.img }" style="width: 100%; height: 100%; object-fit: contain; display: block; transform: skewX(${ is_left || is_horizontal ? '-10deg' : '10deg' });" />
											</div>
										` ).join( '' ) }
									</div>
								</div>
							</div>
						`;
					}

					return `
						<div class="yugen-member-row" style="display: flex; flex-direction: ${ flow_direction }; align-items: center; gap: 12px; pointer-events: none;">
							<div class="yugen-portrait-frame ${ member.is_active ? 'active' : '' } ${ member.is_owner ? 'owned' : '' } ${ member.is_low_health ? 'yugen-low-health-pulse' : '' }" 
								 data-actor-id="${ member.id }" 
								 style="
								 	display: block; width: ${ portrait_size }px; height: ${ portrait_size }px;
									background-image: url('${ member.img }'); background-size: cover; background-position: center top;
									border: 2px solid ${ border_color }; border-radius: 8px;
									position: relative; pointer-events: all; cursor: pointer; background-color: #111;
									box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.9);
									overflow: hidden;
								 " 
								 title="${ member.name }">
								 ${ chat_bubble }
								 ${ inspiration_icon }
								 ${ overlays_html }
								 
								 <div class="yugen-hp-container" style="
								 	position: absolute; bottom: 0; left: 0; right: 0; height: ${ 18 * scale }px;
									background: rgba(0, 0, 0, 0.9); border-top: 1px solid #444; overflow: hidden;
									display: flex; align-items: center; justify-content: center; border-bottom-left-radius: 6px; border-bottom-right-radius: 6px;
									z-index: 10;
								 ">
									<div class="yugen-hp-fill" style="position: absolute; left: 0; top: 0; bottom: 0; width: ${ member.hp.percent }%; background-color: ${ member.hp.color };"></div>
									${ member.hp.temp_percent > 0 ? `<div class="yugen-hp-fill temp" style="position: absolute; left: ${ member.hp.temp_left }%; top: 0; bottom: 0; width: ${ member.hp.temp_percent }%; z-index: 2;"></div>` : '' }
									<div class="yugen-hp-label status" style="position: relative; z-index: 10; font-size: ${ 11 * scale }px; color: ${ member.hp.text_color }; font-weight: bold; text-shadow: 1px 1px 2px black;">${ member.hp.display }</div>
									${ member.show_detail ? `<div class="yugen-hp-label detail" style="display: none; position: relative; z-index: 10; font-size: ${ 10 * scale }px; color: #fff; font-weight: bold; text-shadow: 1px 1px 2px black;">${ member.hp.detail }</div>` : '' }
								 </div>
							</div>
							
							<div class="yugen-side-extras" style="display: flex; flex-direction: ${ extras_flow }; gap: 8px; align-items: ${ extras_align }; pointer-events: all;">
								${ member.alternatives.length > 0 ? `
									<div class="yugen-swap-list" style="display: flex; flex-direction: ${ is_horizontal ? 'row' : ( is_left ? 'row' : 'row-reverse' ) }; gap: 6px; align-items: center;">
										${ member.alternatives.map( ( alt : any ) => `
											<div class="yugen-swap-portrait" 
												 data-swap-id="${ alt.id }" 
												 data-user-id="${ member.user_id }"
												 title="Swap to ${ alt.name }"
												 style="
												 	width: ${ alt_size }px; height: ${ alt_size }px; border-radius: 50%;
													background-image: url('${ alt.img }'); background-size: cover; border: 1px solid #6b5a3c;
													cursor: pointer; box-shadow: 2px 2px 5px rgba(0,0,0,0.8);
													transition: transform 0.15s ease;
												 "></div>
										` ).join( '' ) }
									</div>
								` : '' }
								
								<div class="yugen-effect-list" style="display: flex; flex-direction: ${ is_horizontal ? 'row' : ( is_left ? 'row' : 'row-reverse' ) }; flex-wrap: wrap; gap: 4px; max-width: 150px; pointer-events: none;">
									${ member.effects.map( ( e : any ) => `
										<div class="yugen-effect-icon" data-tooltip="${ e.name }" style="width: ${ icon_size }px; height: ${ icon_size }px; border: 1px solid #6b5a3c; border-radius: 4px; background-color: rgba(0,0,0,0.8); overflow: hidden; pointer-events: all;">
											<img src="${ e.img }" style="width: 100%; height: 100%; object-fit: contain; display: block;" />
										</div>
									` ).join( '' ) }
								</div>
							</div>
						</div>
					`;
				} ).join( '' ) }
				
				${ theme_style === 'default' ? `
					<div class="yugen-default-fan-container" style="${ fan_style }">
						${ context.members.map( ( member : any, idx : number ) => `
							<div class="yugen-default-card" data-index="${ idx }" style="background-image: url('${ member.img }');">
								<div class="yugen-default-card-overlay"></div>
								<div class="yugen-default-card-border"></div>
								<div class="yugen-default-card-name">${ member.name }</div>
							</div>
						` ).join( '' ) }
					</div>
				` : '' }
			</div>
		`;

		return Promise.resolve( html );
	}

	/**
	 * injects the sidebar into the dom and attaches listeners
	 **/
	_replaceHTML( result : any, content : any, options : any ) 
	{
		this.element.innerHTML = result;

		/** retrieve settings **/
		const theme_style = ( game as any ).settings.get( 'yugen-party', 'theme-style' ) || 'default';
		/** retrieve settings **/
		const is_modifiers_enabled = ( game as any ).settings.get( 'yugen-party', 'yugen-modifiers-integration' ) ?? true;

		if ( theme_style === 'default' ) 
		{
			/** default theme portrait listeners **/
			this.element.querySelectorAll( '.yugen-default-portrait-wrapper' ).forEach( ( el : any ) => 
			{
				const index = parseInt( el.dataset.index );
				const actor_id = el.dataset.actorId;
				/** retrieve actor from database **/
				const actor = ( game as any ).actors.get( actor_id );

				el.addEventListener( 'click', ( ) => 
				{
					console.log( `yugen-party | clicking actor: ${ actor?.name }` );
					/** retrieve active tokens on canvas **/
					const token = actor?.getActiveTokens( )[ 0 ];
					if ( token ) 
					{ 
						/** control the token on canvas **/
						token.control( { releaseOthers: true } ); 
						/** pan the canvas to token position **/
						( canvas as any ).animatePan( { x: token.x, y: token.y } ); 
					}
				} );

				/** render actor sheet **/
				el.addEventListener( 'dblclick', ( ) => actor?.sheet.render( true ) );
				/** render actor sheet **/
				el.addEventListener( 'contextmenu', ( event : MouseEvent ) => { event.preventDefault( ); actor?.sheet.render( true ); } );

				el.addEventListener( 'mouseenter', ( ) => 
				{
					const root_el = this.element.querySelector( '.yugen-party-sidebar-root' );
					root_el?.classList.add( 'fan-visible' );

					const cards = this.element.querySelectorAll( '.yugen-default-card' );
					cards.forEach( ( card : any ) => 
					{
						const card_idx = parseInt( card.dataset.index );
						const diff = card_idx - index;
						
						card.className = 'yugen-default-card';
						if ( diff === 0 ) { card.classList.add( 'active-card' ); }
						else if ( diff === -1 ) { card.classList.add( 'prev-card' ); }
						else if ( diff === 1 ) { card.classList.add( 'next-card' ); }
						else if ( diff === -2 ) { card.classList.add( 'far-prev-card' ); }
						else if ( diff === 2 ) { card.classList.add( 'far-next-card' ); }
					} );

					/** yugen-modifiers hover details **/
					if ( is_modifiers_enabled ) 
					{
						/** check active status of modifiers module **/
						const has_modifiers = ( game as any ).modules.get( 'yugen-modifiers' )?.active;
						const hover_manager = ( globalThis as any ).yugen_modifiers?.TokenHoverManager;

						if ( has_modifiers && hover_manager && actor ) 
						{
							const fan_container = this.element.querySelector( '.yugen-default-fan-container' );
							const rect = fan_container ? fan_container.getBoundingClientRect( ) : el.getBoundingClientRect( );
							const scale = ( game as any ).canvas?.stage?.scale?.x || 1.0;
							
							const mock_token = 
							{
								actor: actor,
								name: actor.name,
								id: actor.id,
								w: rect.width / scale,
								h: rect.height / scale,
								worldTransform: 
								{
									tx: rect.left,
									ty: rect.top
								}
							};
							hover_manager.handle_hover( mock_token, true );
						}
					}
				} );

				el.addEventListener( 'mouseleave', ( ) => 
				{
					const root_el = this.element.querySelector( '.yugen-party-sidebar-root' );
					root_el?.classList.remove( 'fan-visible' );
					
					const cards = this.element.querySelectorAll( '.yugen-default-card' );
					cards.forEach( ( card : any ) => 
					{
						card.className = 'yugen-default-card';
					} );

					/** dismiss yugen-modifiers hover details **/
					if ( is_modifiers_enabled ) 
					{
						/** check active status of modifiers module **/
						const has_modifiers = ( game as any ).modules.get( 'yugen-modifiers' )?.active;
						const hover_manager = ( globalThis as any ).yugen_modifiers?.TokenHoverManager;

						if ( has_modifiers && hover_manager && actor ) 
						{
							const mock_token = 
							{
								id: actor.id
							};
							hover_manager.handle_hover( mock_token, false );
						}
					}
				} );
			} );
		}
		else
		{
			/** portrait listeners (both classic and persona) **/
			const portrait_selector = '.yugen-portrait-frame, .yugen-persona-card-wrapper';
			this.element.querySelectorAll( portrait_selector ).forEach( ( el : any ) => 
			{
				const actor_id = el.dataset.actorId;
				/** retrieve actor from database **/
				const actor = ( game as any ).actors.get( actor_id );

				el.addEventListener( 'click', ( ) => 
				{
					console.log( `yugen-party | clicking actor: ${ actor?.name }` );
					/** retrieve active tokens on canvas **/
					const token = actor?.getActiveTokens( )[ 0 ];
					if ( token ) 
					{ 
						/** control the token on canvas **/
						token.control( { releaseOthers: true } ); 
						/** pan the canvas to token position **/
						( canvas as any ).animatePan( { x: token.x, y: token.y } ); 
					}
				} );

				/** render actor sheet **/
				el.addEventListener( 'dblclick', ( ) => actor?.sheet.render( true ) );
				/** render actor sheet **/
				el.addEventListener( 'contextmenu', ( event : MouseEvent ) => { event.preventDefault( ); actor?.sheet.render( true ); } );

				if ( is_modifiers_enabled ) 
				{
					/** check active status of modifiers module **/
					const has_modifiers = ( game as any ).modules.get( 'yugen-modifiers' )?.active;
					const hover_manager = ( globalThis as any ).yugen_modifiers?.TokenHoverManager;

					if ( has_modifiers && hover_manager ) 
					{
						el.addEventListener( 'mouseenter', ( ) => 
						{
							const rect = el.getBoundingClientRect( );
							const scale = ( game as any ).canvas?.stage?.scale?.x || 1.0;
							
							const mock_token = 
							{
								actor: actor,
								name: actor?.name,
								id: actor?.id,
								w: rect.width / scale,
								h: rect.height / scale,
								worldTransform: 
								{
									tx: rect.left,
									ty: rect.top
								}
							};
							hover_manager.handle_hover( mock_token, true );
						} );

						el.addEventListener( 'mouseleave', ( ) => 
						{
							const mock_token = 
							{
								id: actor?.id
							};
							hover_manager.handle_hover( mock_token, false );
						} );
					}
				}
			} );
		}

		/** swap listeners **/
		this.element.querySelectorAll( '.yugen-swap-portrait' ).forEach( ( el : any ) => 
		{
			el.addEventListener( 'click', ( e : MouseEvent ) => 
			{
				e.stopPropagation( );
				const user_id = el.dataset.userId;
				const swap_id = el.dataset.swapId;
				
				this._primary_map.set( user_id, swap_id );

				/** retrieve current user **/
				if ( user_id === ( game as any ).user.id ) 
				{
					/** retrieve actor from database **/
					const actor = ( game as any ).actors.get( swap_id );
					/** retrieve active tokens of the actor **/
					const token = actor?.getActiveTokens( )[ 0 ];
					if ( token ) 
					{
						/** control the token on canvas **/
						token.control( { releaseOthers: true } );
						/** pan canvas to token **/
						( canvas as any ).animatePan( { x: token.x, y: token.y } );
					}
				}

				this.render( );
			} );
		} );


	}

	_get_active_conditions( actor : any ) : string[] 
	{
		const conditions : string[] = [ ];
		if ( !actor ) 
		{ 
			return conditions; 
		}

		/** detect dnd5e active effect status IDs **/
		if ( actor.effects ) 
		{
			actor.effects.forEach( ( e : any ) => 
			{
				if ( !e.disabled && !e.isSuppressed ) 
				{
					if ( e.statuses ) 
					{
						e.statuses.forEach( ( status : string ) => conditions.push( status ) );
					}
					else if ( e.flags?.core?.statusId ) 
					{
						conditions.push( e.flags.core.statusId );
					}
				}
			} );
		}

		/** detect pf2e condition slugs **/
		if ( actor.itemTypes?.condition ) 
		{
			actor.itemTypes.condition.forEach( ( c : any ) => 
			{
				if ( c.slug && !c.system?.references?.parent ) 
				{
					conditions.push( c.slug );
				}
			} );
		}

		/** map to visuals **/
		const condition_overlays : string[] = [ ];
		if ( conditions.includes( 'unconscious' ) || conditions.includes( 'dying' ) || conditions.includes( 'dead' ) || conditions.includes( 'defeat' ) ) 
		{
			condition_overlays.push( 'unconscious' );
		}
		if ( conditions.includes( 'paralyzed' ) || conditions.includes( 'petrified' ) || conditions.includes( 'stunned' ) ) 
		{
			condition_overlays.push( 'paralyzed' );
		}
		if ( conditions.includes( 'blinded' ) ) 
		{
			condition_overlays.push( 'blinded' );
		}
		if ( conditions.includes( 'frightened' ) ) 
		{
			condition_overlays.push( 'frightened' );
		}
		if ( conditions.includes( 'poisoned' ) || conditions.includes( 'sickened' ) ) 
		{
			condition_overlays.push( 'poisoned' );
		}
		if ( conditions.includes( 'deafened' ) ) 
		{
			condition_overlays.push( 'deafened' );
		}
		if ( conditions.includes( 'charmed' ) || conditions.includes( 'fascinated' ) ) 
		{
			condition_overlays.push( 'charmed' );
		}
		if ( conditions.includes( 'grabbed' ) || conditions.includes( 'restrained' ) || conditions.includes( 'immobilized' ) ) 
		{
			condition_overlays.push( 'grabbed' );
		}
		if ( conditions.includes( 'prone' ) ) 
		{
			condition_overlays.push( 'prone' );
		}

		return condition_overlays;
	}
}
