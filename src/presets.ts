import { CompanionButtonPresetDefinition, CompanionPresetDefinitions, InstanceStatus } from '@companion-module/base'
import { ActionId } from './actions'
import { FeedbackId } from './feedback'
import { ControlLocation } from './utils'
import { type CloudInstance } from './index'

interface CompanionPresetExt extends CompanionButtonPresetDefinition {
	locationSort: string
	feedbacks: Array<
		{
			feedbackId: FeedbackId
		} & CompanionButtonPresetDefinition['feedbacks'][0]
	>
	steps: Array<{
		down: Array<
			{
				actionId: ActionId
			} & CompanionButtonPresetDefinition['steps'][0]['down'][0]
		>
		up: Array<
			{
				actionId: ActionId
			} & CompanionButtonPresetDefinition['steps'][0]['up'][0]
		>
	}>
}
interface CompanionPresetDefinitionsExt {
	[id: string]: CompanionPresetExt | undefined
}
export function GetPresetList(instance: CloudInstance): CompanionPresetDefinitions {
	const presets: CompanionPresetDefinitionsExt = {}

	if (instance.cloudState !== InstanceStatus.Ok && instance.cloudState !== InstanceStatus.UnknownWarning) {
		return presets
	}

	for (const controlId of Object.keys(instance.bankCache)) {
		const control = instance.bankCache[controlId]
		let location: ControlLocation = control.location
		if (location === undefined && control.bank === undefined) {
			continue
		}
		if (location === undefined) {
			location = {
				pageNumber: control.page ?? 0,
				row: control.bank ?? 0,
				column: 0,
			}
		}

		const location_text = `${location.pageNumber}/${location.row}/${location.column}`

		const bankCache = instance.bankCache[controlId]?.data || {}
		const preset: CompanionPresetExt = {
			name: `Button for ${location_text}`,
			locationSort: location_text,
			style: {
				text: '',
				cloud: true,
			} as any,
			previewStyle: {
				text: bankCache.text || '',
				size: bankCache.size,
				color: bankCache.color,
				bgcolor: bankCache.bgcolor,
				alignment: bankCache.alignment,
				png64: bankCache.png64,
				cloud: true,
			} as any,
			type: 'button',
			category: `Page ${location.pageNumber}`,
			feedbacks: [
				{
					feedbackId: 'change',
					options: {
						location_target: 'text',
						location_text: location_text,
						filter_enabled: 'no',
					},
				},
			],
			steps: [
				{
					down: [
						{
							actionId: ActionId.buttonDown,
							options: {
								location_target: 'text',
								location_text: location_text,
							},
						},
					],
					up: [
						{
							actionId: ActionId.buttonUp,
							options: {
								location_target: 'text',
								location_text: location_text,
							},
						},
					],
				},
			],
		}

		presets[controlId] = preset
	}
	const sorting = Object.keys(presets)
		.map((id) => ({ id, data: presets[id] }))
		.sort((a, b) => a.data?.locationSort.localeCompare(b.data?.locationSort ?? '', undefined, { numeric: true }) || 0)

	return sorting.reduce((acc, cur) => {
		acc[cur.id] = cur.data
		return acc
	}, {} as CompanionPresetDefinitionsExt)
}
