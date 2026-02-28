const registry = new Map()

const defineSkill = (name, handler, meta = {}) => {
  if (!name || typeof handler !== "function") {
    throw new Error("Invalid skill definition")
  }
  registry.set(name, { handler, meta })
  return registry.get(name)
}

const listSkills = () => Array.from(registry.keys())

const getSkill = (name) => registry.get(name)

module.exports = {
  defineSkill,
  listSkills,
  getSkill,
}
