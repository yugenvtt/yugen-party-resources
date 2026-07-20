/**
 * @file pause-menu.ts
 * handles the rendering and logic of the custom pause menu overlay.
 **/

import { get_party_data_grouped_by_player } from './utils.js';

/**
 * manages the custom pause menu overlay using foundry v14 applicationv2
 **/
export class YugenPauseMenu extends ( foundry.applications.api.ApplicationV2 as any ) 
{
	/** track which actor is currently selected in the details panel **/
	private _selected_actor_id: string | null = null;

	/** track the collapsed state of the pause menu overlay **/
	private _collapsed: boolean = false;

	/**
	 * defines the application configuration
	 **/
	static DEFAULT_OPTIONS = 
	{
		id: 'yugen-pause-menu',
		tag: 'section',
		window: 
		{
			frame: false,
			resizable: false,
		},
		position: 
		{
			width: '100%',
			height: '100%',
		},
	};

	/**
	 * sets the collapsed state of the pause menu
	 **/
	set_collapsed( val : boolean ) : void 
	{
		this._collapsed = val;
	}

	/**
	 * prepares the rendering context for the pause overlay
	 **/
	async _prepareContext( _options : any ) 
	{
		const settings = ( game as any ).settings;
		
		/** retrieve settings **/
		const always_show_on_pause = settings.get( 'yugen-party', 'always-show-on-pause' ) ?? true;
		
		/** retrieve party members grouped by player **/
		const max_players = settings.get( 'yugen-party', 'max-pc-count' ) || 4;
		const player_groups = get_party_data_grouped_by_player( max_players );

		/** gather list of actors **/
		const actors: Actor[] = [ ];
		for ( const group of player_groups ) 
		{
			if ( group.actors && group.actors.length > 0 ) 
			{
				for ( const actor of group.actors ) 
				{
					actors.push( actor );
				}
			}
		}

		/** ensure we have a selected actor ID **/
		if ( actors.length > 0 ) 
		{
			if ( !this._selected_actor_id || !actors.some( ( a : Actor ) => a.id === this._selected_actor_id ) ) 
			{
				this._selected_actor_id = actors[ 0 ].id;
			}
		}

		/** map basic member details for the left carousel **/
		const members = actors.map( ( actor : any ) => 
		{
			const level = actor.system.details?.level?.value || actor.system.details?.level || actor.system.details?.lvl || 1;
			const token_img = actor.prototypeToken?.texture?.src || actor.img;
			return ( {
				id: actor.id,
				name: actor.name,
				img: token_img,
				level: level,
			} );
		} );

		/** fetch detailed info for the selected actor **/
		let selected_data = null;
		const selected_actor = actors.find( ( a : Actor ) => a.id === this._selected_actor_id );
		
		if ( selected_actor ) 
		{
			const level = ( selected_actor as any ).system.details?.level?.value || ( selected_actor as any ).system.details?.level || ( selected_actor as any ).system.details?.lvl || 1;
			
			/** extract class/subclass name **/
			let class_name = "Character";
			if ( ( selected_actor as any ).itemTypes?.class?.length > 0 ) 
			{
				class_name = ( selected_actor as any ).itemTypes.class[ 0 ].name;
				if ( ( selected_actor as any ).itemTypes.subclass?.length > 0 ) 
				{
					class_name = `${ class_name } (${ ( selected_actor as any ).itemTypes.subclass[ 0 ].name })`;
				}
			}
			else if ( ( selected_actor as any ).class?.name ) 
			{
				class_name = ( selected_actor as any ).class.name;
			}

			/** dot-notation property resolver for customizable stats **/
			const resolve_property = ( actor : Actor, path : string ) : { value: string | number, percent: number } => 
			{
				const parts = path.split( '.' );
				let current : any = actor;
				for ( const part of parts ) 
				{
					if ( !current ) break;
					current = current[ part ];
				}
				
				if ( current === undefined || current === null ) 
				{
					return { value: 0, percent: 0 };
				}
				
				if ( typeof current === 'object' ) 
				{
					let val = current.value;
					let max = current.max;
					let mod = current.mod;
					
					if ( typeof val === 'number' && typeof max === 'number' ) 
					{
						return {
							value: `${ val } / ${ max }`,
							percent: Math.clamp( ( val / max ) * 100, 0, 100 )
						};
					}
					if ( typeof val === 'number' ) 
					{
						return {
							value: val,
							percent: Math.clamp( ( val / 20 ) * 100, 0, 100 )
						};
					}
					if ( typeof mod === 'number' ) 
					{
						const virtual_score = 10 + ( mod * 2 );
						return {
							value: mod >= 0 ? `+${ mod }` : mod,
							percent: Math.clamp( ( virtual_score / 20 ) * 100, 0, 100 )
						};
					}
				}
				
				if ( typeof current === 'number' ) 
				{
					return {
						value: current,
						percent: Math.clamp( ( current / 20 ) * 100, 0, 100 )
					};
				}
				
				return { value: String( current ), percent: 100 };
			};

			/** retrieve abilities with mod-only fallback for pathfinder **/
			const get_ability = ( key : string ) => 
			{
				const ability = ( selected_actor as any ).system.abilities?.[ key ];
				if ( !ability ) 
				{
					return { value: 10, mod: 0 };
				}
				
				let val = ability.value;
				let mod = ability.mod;
				
				if ( typeof val !== 'number' && typeof mod === 'number' ) 
				{
					val = 10 + ( mod * 2 );
				}
				else if ( typeof val === 'number' && typeof mod !== 'number' ) 
				{
					mod = Math.floor( ( val - 10 ) / 2 );
				}
				
				return {
					value: typeof val === 'number' ? val : 10,
					mod: typeof mod === 'number' ? mod : 0
				};
			};

			const stat_definitions : Record<string, { label: string, getValue: (a: Actor) => { value: number | string, percent: number }, barClass: string }> = 
			{
				str: {
					label: 'Strength',
					getValue: (a) => {
						const val = get_ability('str').value;
						return { value: val, percent: Math.clamp((val / 20) * 100, 0, 100) };
					},
					barClass: 'str-bar'
				},
				dex: {
					label: 'Dexterity',
					getValue: (a) => {
						const val = get_ability('dex').value;
						return { value: val, percent: Math.clamp((val / 20) * 100, 0, 100) };
					},
					barClass: 'dex-bar'
				},
				con: {
					label: 'Constitution',
					getValue: (a) => {
						const val = get_ability('con').value;
						return { value: val, percent: Math.clamp((val / 20) * 100, 0, 100) };
					},
					barClass: 'con-bar'
				},
				int: {
					label: 'Intelligence',
					getValue: (a) => {
						const val = get_ability('int').value;
						return { value: val, percent: Math.clamp((val / 20) * 100, 0, 100) };
					},
					barClass: 'int-bar'
				},
				wis: {
					label: 'Wisdom',
					getValue: (a) => {
						const val = get_ability('wis').value;
						return { value: val, percent: Math.clamp((val / 20) * 100, 0, 100) };
					},
					barClass: 'wis-bar'
				},
				cha: {
					label: 'Charisma',
					getValue: (a) => {
						const val = get_ability('cha').value;
						return { value: val, percent: Math.clamp((val / 20) * 100, 0, 100) };
					},
					barClass: 'cha-bar'
				},
				hp: {
					label: 'Hit Points',
					getValue: (a) => {
						const hp = (a as any).system.attributes?.hp || { value: 0, max: 0 };
						return { value: `${hp.value} / ${hp.max}`, percent: Math.clamp((hp.value / (hp.max || 1)) * 100, 0, 100) };
					},
					barClass: 'hp-bar'
				},
				ac: {
					label: 'Armor Class',
					getValue: (a) => {
						const ac = (a as any).system.attributes?.ac?.value || 10;
						return { value: ac, percent: Math.clamp((ac / 30) * 100, 0, 100) };
					},
					barClass: 'ac-bar'
				}
			};

			const setting_val = ((game as any).settings.get('yugen-party', 'pause-stats-list') || 'str,dex,con,int,wis,cha,hp');
			const enabled_items = setting_val.split(',').map((s: string) => s.trim());

			const rendered_stats = enabled_items.map((item: string) => 
			{
				if ( item.includes(':') ) 
				{
					const parts = item.split(':');
					const label = parts[0].trim();
					const path = parts[1].trim();
					const barClass = (parts[2] || 'wis-bar').trim();
					
					const data = resolve_property(selected_actor, path);
					return {
						label,
						value: data.value,
						percent: data.percent,
						barClass
					};
				}
				else 
				{
					const key = item.toLowerCase();
					const def = stat_definitions[key];
					if ( def ) 
					{
						const data = def.getValue(selected_actor);
						return {
							label: def.label,
							value: data.value,
							percent: data.percent,
							barClass: def.barClass
						};
					}
				}
				return null;
			}).filter(Boolean);

			/** retrieve feats / features **/
			const feats = selected_actor.items
				.filter( ( i : any ) => i.type === 'feat' || i.type === 'action' || i.type === 'ability' )
				.slice( 0, 2 )
				.map( ( i : any ) => 
				{
					const raw_desc = i.system?.description?.value || "";
					const clean_desc = raw_desc.replace( /<[^>]*>/g, '' ).substring( 0, 150 );
					return ( {
						name: i.name,
						img: i.img || 'icons/svg/mystery-man.svg',
						description: clean_desc ? `${ clean_desc }...` : 'No description available.',
					} );
				} );

			selected_data = 
			{
				id: selected_actor.id,
				name: selected_actor.name,
				img: selected_actor.img,
				level: level,
				class_name: class_name,
				stats: rendered_stats,
				feats: feats,
			};
		}

		return ( {
			members,
			selected_id: this._selected_actor_id,
			selected: selected_data,
			collapsed: this._collapsed,
			always_show_on_pause: always_show_on_pause,
		} );
	}

	/**
	 * renders the html for the custom pause overlay
	 **/
	_renderHTML( context : any ) 
	{
		if ( context.members.length === 0 ) 
		{ 
			return Promise.resolve( '' ); 
		}

		const collapsed = context.collapsed;
		const selected = context.selected;
		const always_show_on_pause = context.always_show_on_pause;

		const html = `
			<div class="yugen-pause-overlay-root ${ collapsed ? 'collapsed' : 'expanded' }">
				<div class="yugen-pause-handle" title="Toggle pause menu">
					<i class="fas ${ collapsed ? 'fa-pause' : 'fa-times' }"></i>
				</div>
				
				<div class="yugen-pause-content">
					<!-- left section: character carousel -->
					<div class="yugen-pause-left">
						<div class="yugen-pause-header">
							<i class="fas fa-chevron-left yugen-pause-back-btn"></i>
							<div class="yugen-pause-title">Characters</div>
						</div>
						
						<div class="yugen-pause-carousel">
							${ context.members.map( ( member : any ) => `
								<div class="yugen-pause-member-item ${ context.selected_id === member.id ? 'active' : '' }" data-actor-id="${ member.id }">
									<div class="yugen-pause-avatar-wrapper">
										<div class="yugen-pause-avatar" style="background-image: url('${ member.img }');"></div>
										<div class="yugen-pause-level-badge">LV.${ member.level }</div>
									</div>
									<div class="yugen-pause-member-info">
										<span class="yugen-pause-member-name">${ member.name }</span>
									</div>
								</div>
							` ).join( '' ) }
						</div>
					</div>
					
					${ selected ? `
						<!-- center section: selected character card artwork -->
						<div class="yugen-pause-center">
							<div class="yugen-pause-card">
								<div class="yugen-pause-card-bg" style="background-image: url('${ selected.img }');"></div>
								<div class="yugen-pause-card-artwork" style="background-image: url('${ selected.img }');"></div>
								<div class="yugen-pause-card-overlay"></div>
								<div class="yugen-pause-card-info">
									<span class="yugen-pause-card-name">${ selected.name }</span>
								</div>
							</div>
						</div>
						
						<!-- right section: character stats & abilities -->
						<div class="yugen-pause-right">
							<!-- top details header -->
							<div class="yugen-pause-details-header">
								<div class="yugen-pause-level-circle">
									<span class="level-num">${ selected.level }</span>
									<span class="level-lbl">LEVEL</span>
								</div>
								<div class="yugen-pause-name-section">
									<h1 class="yugen-pause-char-name">${ selected.name }</h1>
									<span class="yugen-pause-class-badge">${ selected.class_name }</span>
								</div>
							</div>
							
							<!-- stats progress bars -->
							<div class="yugen-pause-stats-list">
								${ selected.stats.map( ( stat : any ) => `
								<div class="yugen-pause-stat-row">
									<div class="stat-info">
										<span class="stat-name">${ stat.label }</span>
										<span class="stat-value">${ stat.value }</span>
									</div>
									<div class="stat-bar-container">
										<div class="stat-bar ${ stat.barClass }" style="width: ${ stat.percent }%"></div>
									</div>
								</div>
								` ).join( '' ) }
							</div>
							
							<!-- feats / abilities section -->
							<div class="yugen-pause-passive-section">
								<h2 class="passive-header">Special Abilities</h2>
								<div class="passive-list">
									${ selected.feats.length > 0 ? selected.feats.map( ( feat : any ) => `
										<div class="passive-item">
											<div class="passive-icon" style="background-image: url('${ feat.img }');"></div>
											<div class="passive-details">
												<div class="passive-title">${ feat.name }</div>
												<div class="passive-description">${ feat.description }</div>
											</div>
										</div>
									` ).join( '' ) : `
										<div class="passive-item empty">
											<div class="passive-details">
												<div class="passive-description">No special abilities or features found.</div>
											</div>
										</div>
									` }
								</div>
							</div>
							
							<!-- pause menu settings -->
							<div class="yugen-pause-settings">
								<label class="yugen-pause-checkbox-container">
									<input type="checkbox" id="yugen-always-show-on-pause" ${ always_show_on_pause ? 'checked' : '' } />
									<span class="checkbox-label">Always Show When Paused</span>
								</label>
							</div>
						</div>
					` : '' }
				</div>
			</div>
		`;

		return Promise.resolve( html );
	}

	/**
	 * replaces application HTML and registers interactive event listeners
	 **/
	_replaceHTML( result : any, content : any, options : any ) 
	{
		this.element.innerHTML = result;

		/** collapse / expand handle listener **/
		const handle = this.element.querySelector( '.yugen-pause-handle' );
		if ( handle ) 
		{
			handle.addEventListener( 'click', ( ) => 
			{
				this._collapsed = !this._collapsed;
				this.render( );
			} );
		}

		/** back button behaves as a collapse button **/
		const back_btn = this.element.querySelector( '.yugen-pause-back-btn' );
		if ( back_btn ) 
		{
			back_btn.addEventListener( 'click', ( ) => 
			{
				this._collapsed = true;
				this.render( );
			} );
		}

		/** carousel member click listener **/
		this.element.querySelectorAll( '.yugen-pause-member-item' ).forEach( ( item : any ) => 
		{
			item.addEventListener( 'click', ( ) => 
			{
				const actor_id = item.dataset.actorId;
				if ( actor_id ) 
				{
					this._selected_actor_id = actor_id;
					this.render( );
				}
			} );
		} );

		/** always show on pause checkbox change listener **/
		const always_show_checkbox = this.element.querySelector( '#yugen-always-show-on-pause' ) as HTMLInputElement;
		if ( always_show_checkbox ) 
		{
			always_show_checkbox.addEventListener( 'change', ( event : Event ) => 
			{
				const checked = ( event.target as HTMLInputElement ).checked;
				/** update settings **/
				( game as any ).settings.set( 'yugen-party', 'always-show-on-pause', checked );
			} );
		}
	}
}
