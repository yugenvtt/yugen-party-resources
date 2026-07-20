/**
 * @file utils.ts
 * surgical utility functions for the party ui.
 **/

/**
 * groups characters on the scene by their primary player owner
 **/
export function get_party_data_grouped_by_player( max_players : number ) : any[] 
{
	const filter_setting = ( game as any ).settings.get( 'yugen-party', 'actor-filter' ) || '';
	const allowed_names = filter_setting.split( ',' ).map( ( n : string ) => n.trim( ).toLowerCase( ) ).filter( ( n : string ) => n.length > 0 );

	const actors_on_scene = ( canvas as any ).tokens?.placeables
		.map( ( t : any ) => t.actor )
		.filter( ( a : any ) => 
		{
			if ( !a ) 
			{ 
				return false; 
			}

			/** if filter is active, only show exact matches regardless of type **/
			if ( allowed_names.length > 0 ) 
			{ 
				return allowed_names.includes( a.name.toLowerCase( ) );
			}

			/** if no filter, default to only showing player characters **/
			return a.type === 'character';
		} );

	/** unique actors only **/
	const unique_actors = Array.from( new Set( actors_on_scene ) ) as Actor[];
	
	/** group by primary owner id **/
	const groups : Map<string, Actor[]> = new Map( );

	for ( const actor of unique_actors ) 
	{
		/** 
		 * find the first player who owns this actor.
		 * we check the ownership object directly because players may not have 
		 * permission to use testUserPermission on other users.
		 **/
		const owner_id = Object.entries( actor.ownership ).find( ( [ uid, level ] ) => 
		{
			const user = ( game as any ).users.get( uid );
			return level === 3 && user && !user.isGM;
		} )?.[ 0 ];

		/** 
		 * group by owner if assigned to a player.
		 * if unassigned, group by name to keep different npc types separate.
		 **/
		const group_id = owner_id || `unassigned-${ actor.name }`;

		if ( !groups.has( group_id ) ) 
		{
			groups.set( group_id, [ ] );
		}
		groups.get( group_id )?.push( actor );
	}

	/** convert to array of player groups, limited by max_players **/
	const result : any[] = [ ];
	let count = 0;

	/** prioritize the current user's group to always show up first **/
	const current_user_id = ( game as any ).user.id;
	if ( groups.has( current_user_id ) ) 
	{
		result.push( {
			user_id: current_user_id,
			user_name: ( game as any ).user.name,
			actors: groups.get( current_user_id )
		} );
		groups.delete( current_user_id );
		count++;
	}

	for ( const [ user_id, actors ] of groups ) 
	{
		if ( count >= max_players ) { break; }
		
		const user = ( game as any ).users.get( user_id );
		result.push( {
			user_id,
			user_name: user?.name || "Unassigned",
			actors: actors
		} );
		count++;
	}

	return result;
}

/**
 * stylizes user names to conform with formatting guidelines.
 **/
export function format_user_name( name: string ): string 
{
	const clean = name.toLowerCase( );
	if ( clean === 'yugen' || clean === 'yugen.' ) 
	{
		return 'yugen.';
	}

	return name;
}

/**
 * formats and posts custom resource changes to chat.
 **/
export function post_change_to_chat( 
	label: string, 
	old_val: number, 
	new_val: number, 
	user: any 
): void 
{
	const diff = new_val - old_val;
	if ( diff === 0 ) 
	{
		return;
	}

	const diff_str = diff > 0 ? `+${ diff }` : `${ diff }`;
	const user_name = format_user_name( user.name || 'Unknown' );

	/** compile chat message via localizations **/
	const content = ( game as any ).i18n.format( 'yugen-party.chat.updated', 
	{
		user: user_name,
		label: label,
		old: old_val,
		new: new_val,
		diff: diff_str
	} );

	/** post to foundry chat log **/
	void ( ChatMessage as any ).create( 
	{
		content: content,
		speaker: 
		{
			alias: 'yugen-party'
		}
	} );
}
