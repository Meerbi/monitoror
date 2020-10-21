import TileStatus from '@/enums/tileStatus'
import TileType from '@/enums/tileType'
import TileAuthor from '@/interfaces/tileAuthor'
import TileBuild from '@/interfaces/tileBuild'
import TileConfig from '@/interfaces/tileConfig'
import TileMergeRequest from '@/interfaces/tileMergeRequest'
import TileState from '@/interfaces/tileState'
import {RootState} from '@/store'
import {addSeconds, differenceInSeconds, format, formatDistance} from 'date-fns'
import {computed} from 'vue'
import {useStore} from 'vuex'

export default function useMonitororTile(config: TileConfig) {
  const store = useStore<RootState>()

  const type = computed((): TileType => {
    return config.type
  })

  const stateKey = computed((): string => {
    return config.stateKey
  })

  const theme = computed((): string => {
    return store.getters.theme.toString().toLowerCase()
  })

  const now = computed((): Date => {
    return store.state.now
  })

  const state = computed((): TileState | undefined => {
    if (!Object.keys(store.state.tilesState).includes(stateKey.value)) {
      return
    }

    return store.state.tilesState[stateKey.value]
  })

  const mergeRequestLabelPrefix = computed((): string | undefined => {
    if (mergeRequest.value === undefined) {
      return
    }

    let mergeRequestPrefix = 'MR'
    if (type.value === TileType.GitHubPullRequest) {
      mergeRequestPrefix = 'PR'
    }

    return mergeRequestPrefix + '#' + mergeRequest.value.id
  })

  const label = computed((): string | undefined => {
    if (config.label) {
      if (config.label === '-') {
        return
      }

      return config.label
    }

    if (state.value === undefined) {
      return
    }

    return state.value.label
  })

  const build = computed((): TileBuild | undefined => {
    if (state.value === undefined) {
      return
    }

    return state.value.build
  })

  const branch = computed((): string | undefined => {
    if (build.value === undefined) {
      return
    }

    return build.value.branch
  })

  const mergeRequest = computed((): TileMergeRequest | undefined => {
    if (build.value === undefined) {
      return
    }

    return build.value.mergeRequest
  })

  const status = computed((): string | undefined => {
    if (state.value === undefined) {
      return
    }

    return state.value.status
  })

  const previousStatus = computed((): string | undefined => {
    if (build.value === undefined) {
      return
    }

    return build.value.previousStatus
  })

  const isQueued = computed((): boolean => {
    return status.value === TileStatus.Queued
  })

  const isRunning = computed((): boolean => {
    return status.value === TileStatus.Running
  })

  const isSucceeded = computed((): boolean => {
    if (isQueued.value || isRunning.value) {
      return previousStatus.value === TileStatus.Success
    }

    return status.value === TileStatus.Success
  })

  const isFailed = computed((): boolean => {
    if (isQueued.value || isRunning.value) {
      return previousStatus.value === TileStatus.Failed
    }

    return status.value === TileStatus.Failed
  })

  const isWarning = computed((): boolean => {
    if (isQueued.value || isRunning.value) {
      return previousStatus.value === TileStatus.Warning
    }

    return status.value === TileStatus.Warning
  })

  const startedAt = computed((): Date | undefined => {
    if (build.value === undefined || build.value.startedAt === undefined) {
      return
    }

    return new Date(build.value.startedAt)
  })

  const finishedAt = computed((): Date | undefined => {
    if (build.value === undefined || build.value.finishedAt === undefined) {
      return
    }

    return new Date(build.value.finishedAt)
  })

  const duration = computed((): number | undefined => {
    if (startedAt.value === undefined) {
      return
    }

    return differenceInSeconds(now.value, startedAt.value)
  })

  const estimatedDuration = computed((): number | undefined => {
    if (build.value === undefined) {
      return
    }

    return build.value.estimatedDuration
  })

  const progress = computed((): number | undefined => {
    if (duration.value === undefined || estimatedDuration.value === undefined) {
      return
    }

    const progress = duration.value / estimatedDuration.value * 100

    return progress
  })

  const progressTime = computed((): string | undefined => {
    if (progress.value === undefined || estimatedDuration.value === undefined || duration.value === undefined) {
      return
    }

    const totalSeconds = Math.abs(Math.round((estimatedDuration.value - duration.value)))

    const overtimePrefix = (progress.value > 100 ? 'Overtime: +' : '')
    const date = addSeconds(new Date(0), totalSeconds)
    const dateFormat = totalSeconds > 3600 ? 'hh:mm:ss' : 'mm:ss'

    return overtimePrefix + format(date, dateFormat)
  })

  const isOvertime = computed((): boolean => {
    if (progressTime.value === undefined) {
      return false
    }

    return progressTime.value.includes('+')
  })

  const progressBarStyle = computed((): { transform: string } | undefined => {
    if (progress.value === undefined) {
      return
    }

    const progressPercentage = Math.min(progress.value, 100)

    return {
      transform: `translateX(${-100 + progressPercentage}%)`,
    }
  })

  const finishedSince = computed((): string | undefined => {
    if (finishedAt.value === undefined) {
      return
    }

    return formatDistance(finishedAt.value, now.value) + ' ago'
  })

  const author = computed((): TileAuthor | undefined => {
    if (build.value === undefined) {
      return
    }

    return build.value.author
  })

  const showAuthor = computed((): boolean => {
    return author.value !== undefined && status.value === TileStatus.Failed
  })

  return {
    type,
    stateKey,
    theme,
    now,
    state,
    mergeRequestLabelPrefix,
    label,
    build,
    branch,
    mergeRequest,
    status,
    previousStatus,
    isQueued,
    isRunning,
    isSucceeded,
    isFailed,
    isWarning,
    startedAt,
    finishedAt,
    duration,
    estimatedDuration,
    progress,
    progressTime,
    isOvertime,
    progressBarStyle,
    finishedSince,
    author,
    showAuthor,
  }
}
