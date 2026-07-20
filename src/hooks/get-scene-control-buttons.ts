/**
 * @file src/hooks/get-scene-control-buttons.ts
 * adds tool buttons to the scene controls for viewing and configuring party resources.
 **/

import { ResourceConfig } from '../module/resource-config.js';
import { ResourceViewer } from '../module/resource-viewer.js';

export const get_scene_control_buttons_hook = ( ) => 
{
	/** listen for scene controls construction **/
	Hooks.on( 'getSceneControlButtons', ( controls: any ) => 
	{
		/** register viewer tool on the token layer for all users **/
		const viewer_tool = 
		{
			name: 'yugen-party-viewer',
			title: ( game as any ).i18n.localize( 'yugen-party.viewer.title' ),
			icon: 'fas fa-briefcase',
			onClick: ( ) => 
			{
				ResourceViewer.instance.render( 
				{
					force: true
				} );
			},
			button: true
		};

		( globalThis as any ).yugen_utils.register_control_tool( controls, 'tokens', viewer_tool );

		/** only show config tool to gamemasters **/
		if ( ( game as any ).user.isGM ) 
		{
			const tool = 
			{
				name: 'yugen-party-config',
				title: ( game as any ).i18n.localize( 'yugen-party.config.title' ),
				icon: 'fas fa-sliders-h',
				onClick: ( ) => 
				{
					const config = new ResourceConfig( );
					config.render( 
					{
						force: true
					} );
				},
				button: true
			};

			/** register config tool on the notes layer **/
			( globalThis as any ).yugen_utils.register_control_tool( controls, 'notes', tool );
		}
	} );
};
