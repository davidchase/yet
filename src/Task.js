import { pending } from './FutureValue'
import * as F from './fn'

// task :: ((a -> ()) -> Kill) -> Task a
// Create a Task that will produce a result by running a function
export const task = run => new Resolver(run)

// run :: Task a -> FutureValue a
// Execute a Task that will produce a result.  Returns a FutureValue
// representing the eventual result.
export const run = task => {
  const futureValue = pending()
  const kill = task.run(Date.now, new SetFutureValue(futureValue))
  return { kill: () => kill.kill(), futureValue }
}

// Base Task, provides default implementations of Task API
// Specializations may provide optimized implementations of methods
class Task {
  map (f) {
    return new Map(f, this)
  }
}

// Run a callback-accepting function to produce a result
class Resolver extends Task {
  constructor (run) {
    super()
    this._run = run
  }

  run (now, action) {
    return this._run(x => action.react(now(), x))
  }
}

class SetFutureValue {
    constructor (futureValue) {
      this.futureValue = futureValue
    }

    react(t, x) {
      return this.futureValue.write(t, x)
    }
}

// A Task whose value is the mapped result of another Task
class Map extends Task {
  constructor (ab, task) {
    super()
    this.ab = ab
    this.task = task
  }

  run (now, action) {
    return this.task.run(now, new Mapped(this.ab, action))
  }
}

class Mapped {
  constructor (ab, reaction) {
    this.ab = ab
    this.reaction = reaction
  }

  react (t, x) {
    return this.reaction.react(t, F.map(this.ab, x))
  }
}
