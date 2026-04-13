import { format } from 'date-fns'

export const VERSION_REGEX = /^(?<tag>[\s/]*@version\s+)(?<version>\S+.*)$\n/m
export const versionForToday = () => format(new Date(), 'yyyy.MM.dd')
