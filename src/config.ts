/*
 * This file is part of the Companion project
 * Copyright (c) 2018 Bitfocus AS
 * Authors: William Viker <william@bitfocus.io>, Håkon Nessjøen <haakon@bitfocus.io>
 *
 * This program is free software.
 * You should have received a copy of the MIT licence as well as the Bitfocus
 * Individual Contributor License Agreement for companion along with
 * this program.
 *
 * You can be released from the requirements of the license by purchasing
 * a commercial license. Buying such a license is mandatory as soon as you
 * develop commercial activities involving the Companion software without
 * disclosing the source code of your own applications.
 *
 */
import { SomeCompanionConfigField } from '@companion-module/base'

export interface CloudConfig {
	uuid: string
}

export const GetConfigFields = (): SomeCompanionConfigField[] => {
	return [
		{
			type: 'textinput',
			id: 'uuid',
			label: 'Super secret key of the remote companion instance you want to remote control',
			width: 12,
			default: '',
		},
		{
			type: 'static-text',
			width: 12,
			value:
				'To use this module you need to have access to a companion instance has companion cloud licenses assigned. Check the Cloud section in companion to read more about how to enable this feature in a remote companion.',
			id: 'moduleinfo',
			label: 'Important note',
		},
	]
}
