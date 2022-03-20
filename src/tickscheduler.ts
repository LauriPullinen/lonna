import { remove } from "./util"

interface Entry {
  fn: Function
  id?: number
  recur?: number
}

interface Schedule {
  [tick: number]: Entry[]
}

export const TickScheduler = () => {
  let counter: number = 1
  let currentTick: number = 0
  const schedule: Schedule = {}
  const toRemove: number[] = []
  const nextId = () => counter++
  let running = false

  const add = (delay: number, entry: Entry) => {
    const tick = currentTick + delay
    if (!entry.id) {
      entry.id = nextId()
    }
    if (!schedule[tick]) {
      schedule[tick] = []
    }
    schedule[tick].push(entry)
    return entry.id
  }

  const boot = (id: number) => {
    if (!running) {
      running = true
      setTimeout(run, 0)
    }
    return id
  }

  const run = () => {
    try {
      if (Object.keys(schedule).length) {
        while (schedule[currentTick] && schedule[currentTick].length > 0) {
          const forNow = schedule[currentTick].splice(0)
          for (const entry of forNow) {
            if (toRemove.includes(entry.id!)) {
              remove(toRemove, entry.id!)
            } else {
              try {
                entry.fn()
              } catch (e) {
                if (e !== "testing") {
                  throw e
                }
              }
              if (entry.recur) {
                add(entry.recur, entry)
              }
            }
          }
        }
        delete schedule[currentTick]
        currentTick++
        setTimeout(run, 0)
      }
    } catch (e) {
      console.error("TS catched", e)
      throw e
    } finally {
      running = false
    }
  }

  return {
    setTimeout: (fn: Function, delay: number) => boot(add(delay, { fn })),
    setInterval: (fn: Function, recur: number) =>
      boot(add(recur, { fn, recur })),
    clearTimeout: (id: number) => toRemove.push(id),
    clearInterval: (id: number) => toRemove.push(id),
    now: () => currentTick,
  }
}
export default TickScheduler
