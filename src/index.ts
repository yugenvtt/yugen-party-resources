/**
 * @file index.ts
 * entry point for the yugen-party module.
 **/

import { init_hook } from './hooks/init.js';
import { ready_hook } from './hooks/ready.js';
import { get_scene_control_buttons_hook } from './hooks/get-scene-control-buttons.js';

/** initialize the module **/
init_hook( );

/** set up ready hook **/
ready_hook( );

/** inject scene controls **/
get_scene_control_buttons_hook( );
