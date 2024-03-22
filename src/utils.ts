import { InstanceBase, InstanceStatus, LogLevel } from '@companion-module/base'
import { CCLogLevel, CCModuleState, CloudClient } from 'companion-cloud-client'

export function CCModuleState2InstanceState(state: CCModuleState): InstanceStatus {
	return {
		IDLE: InstanceStatus.Connecting,
		WARNING: InstanceStatus.UnknownWarning,
		ERROR: InstanceStatus.ConnectionFailure,
		OK: InstanceStatus.Ok,
	}[state]
}

export interface ControlLocation {
	pageNumber: number
	row: number
	column: number
}

export function CCLogLevel2LogLevel(level: CCLogLevel): LogLevel {
	return {
		error: 'error',
		warning: 'warn',
		info: 'info',
		debug: 'debug',
	}[level] as LogLevel
}

export function CreateLocationFromLocationText(locationText: string): ControlLocation {
	const [pageNumber, row, column] = locationText.split('/').map((x) => parseInt(x, 10))
	return {
		pageNumber: pageNumber ?? 0,
		row: row ?? 0,
		column: column ?? 0,
	}
}

export function CreateModuleControlId(location: ControlLocation): string {
	return `cmi:${location.pageNumber}-${location.row}-${location.column}`
}

export function ParseModuleControlId(controlId: string): ControlLocation | undefined {
	const match = controlId.match(/^cmi:(\d+)-(\d+)-(\d+)$/)
	if (match) {
		return {
			pageNumber: parseInt(match[1], 10),
			row: parseInt(match[2], 10),
			column: parseInt(match[3], 10),
		}
	}

	return undefined
}

export interface InstanceBaseExt<TConfig> extends InstanceBase<TConfig> {
	[x: string]: any
	cloudClient: CloudClient | null
	config: TConfig
	cloudState: InstanceStatus
	UpdateVariablesValues(): void
	InitVariables(): void
}
