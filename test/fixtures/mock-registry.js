/*
 * Mock registry class
 *
 * This should end up as the centralized place where we generate test fixtures
 * for tests against any registry data.
 */
const pacote = require('pacote')
class MockRegistry {
  #tap
  #nock
  #registry
  #authorization

  constructor (opts) {
    if (!opts.registry) {
      throw new Error('mock registry requires a registry value')
    }
    this.#registry = (new URL(opts.registry)).origin
    this.#authorization = opts.authorization
    // Required for this.package
    this.#tap = opts.tap
  }

  get nock () {
    if (!this.#nock) {
      if (!this.#tap) {
        throw new Error('cannot mock packages without a tap fixture')
      }
      const tnock = require('./tnock.js')
      const reqheaders = {}
      if (this.#authorization) {
        reqheaders.authorization = `Bearer ${this.#authorization}`
      }
      this.#nock = tnock(this.#tap, this.#registry, { reqheaders })
    }
    return this.#nock
  }

  set nock (nock) {
    this.#nock = nock
  }

  whoami ({ username }) {
    this.nock.get('/-/whoami').reply(200, { username })
  }

  access ({ spec, access, publishRequires2fa }) {
    const body = {}
    if (access !== undefined) {
      body.access = access
    }
    if (publishRequires2fa !== undefined) {
      body.publish_requires_tfa = publishRequires2fa
    }
    this.nock.post(
      `/-/package/${encodeURIComponent(spec)}/access`,
      body
    ).reply(200)
  }

  grant ({ spec, team, permissions }) {
    if (team.startsWith('@')) {
      team = team.slice(1)
    }
    const [scope, teamName] = team.split(':')
    this.nock.put(
      `/-/team/${encodeURIComponent(scope)}/${encodeURIComponent(teamName)}/package`,
      { package: spec, permissions }
    ).reply(200)
  }

  revoke ({ spec, team }) {
    if (team.startsWith('@')) {
      team = team.slice(1)
    }
    const [scope, teamName] = team.split(':')
    this.nock.delete(
      `/-/team/${encodeURIComponent(scope)}/${encodeURIComponent(teamName)}/package`,
      { package: spec }
    ).reply(200)
  }

  // team can be a team or a username
  lsPackages ({ team, packages = {} }) {
    if (team.startsWith('@')) {
      team = team.slice(1)
    }
    const [scope, teamName] = team.split(':')
    let uri
    if (teamName) {
      uri = `/-/team/${encodeURIComponent(scope)}/${encodeURIComponent(teamName)}/package`
    } else {
      uri = `/-/org/${encodeURIComponent(scope)}/package`
    }
    this.nock.get(uri).query({ format: 'cli' }).reply(200, packages)
  }

  lsCollaborators ({ spec, user, collaborators = {} }) {
    const query = { format: 'cli' }
    if (user) {
      query.user = user
    }
    this.nock.get(`/-/package/${encodeURIComponent(spec)}/collaborators`)
      .query(query)
      .reply(200, collaborators)
  }

  advisory (advisory = {}) {
    const id = advisory.id || parseInt(Math.random() * 1000000)
    return {
      id,
      url: `https://github.com/advisories/GHSA-${id}`,
      title: `Test advisory ${id}`,
      severity: 'high',
      vulnerable_versions: '*',
      cwe: [
        'cwe-0',
      ],
      cvss: {
        score: 0,
      },
      ...advisory,
    }
  }

  async package ({ manifest, times = 1, query, tarballs }) {
    let nock = this.nock
    nock = nock.get(`/${manifest.name}`).times(times)
    if (query) {
      nock = nock.query(query)
    }
    nock = nock.reply(200, manifest)
    if (tarballs) {
      for (const version in tarballs) {
      // for (const version in manifest.versions) {
        const packument = manifest.versions[version]
        const dist = new URL(packument.dist.tarball)
        const tarball = await pacote.tarball(tarballs[version])
        nock.get(dist.pathname).reply(200, tarball)
      }
    }
    this.nock = nock
  }

  // the last packument in the packuments array will be tagged as latest
  manifest ({ name = 'test-package', packuments } = {}) {
    packuments = this.packuments(packuments, name)
    const latest = packuments.slice(-1)[0]
    const manifest = {
      _id: `${name}@${latest.version}`,
      _rev: '00-testdeadbeef',
      name,
      description: 'test package mock manifest',
      dependencies: {},
      versions: {},
      time: {},
      'dist-tags': { latest: latest.version },
      ...latest,
    }

    for (const packument of packuments) {
      manifest.versions[packument.version] = {
        _id: `${name}@${packument.version}`,
        name,
        description: 'test package mock manifest',
        dependencies: {},
        dist: {
          tarball: `${this.#registry}/${name}/-/${name}-${packument.version}.tgz`,
        },
        ...packument,
      }
      manifest.time[packument.version] = new Date()
    }

    return manifest
  }

  packuments (packuments = ['1.0.0'], name) {
    return packuments.map(p => this.packument(p, name))
  }

  // Generate packument from shorthand
  packument (packument, name = 'test-package') {
    if (!packument.version) {
      packument = { version: packument }
    }
    return {
      name,
      version: '1.0.0',
      description: 'mocked test package',
      dependencies: {},
      ...packument,
    }
  }
}

module.exports = MockRegistry
