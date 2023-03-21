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

export function CCLogLevel2LogLevel(level: CCLogLevel): LogLevel {
	return {
		error: 'error',
		warning: 'warn',
		info: 'info',
		debug: 'debug',
	}[level] as LogLevel
}

export function CreateBankControlId(page: number, bank: number): string {
	return `bank:${page}-${bank}`
}

export function ParseControlId(controlId: string): { page: number; bank: number } | undefined {
	const match = controlId.match(/^bank:(\d+)-(\d+)$/)
	if (match) {
		return {
			page: Number(match[1]),
			bank: Number(match[2]),
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
