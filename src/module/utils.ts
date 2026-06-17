/**
 * @file src/module/utils.ts
 * surgical helper utilities for the party resources module.
 **/

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
	const content = ( game as any ).i18n.format( 'yugen-party-resources.chat.updated', 
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
			alias: 'yugen-party-resources'
		}
	} );
}
