const BASE_URL = 'https://gps-api.mdcdev.me'

export interface Device {
  id: string
  trackerID: string
  name: string
  vehicleName?: string
  owner?: string
  latitude?: number
  longitude?: number
  speed: number
  status: 'online' | 'offline'
  battery?: number
  timestamp: string
}

export interface Position {
  id: string
  latitude: number
  longitude: number
  speed: number
  timestamp: string
}

export interface Trip {
  id: string
  startTime: string
  endTime: string
  distance: number
  duration: number
  averageSpeed: number
}

export interface Event {
  id: string
  type: string
  description: string
  timestamp: string
  latitude?: number
  longitude?: number
}

export interface Command {
  id: string
  deviceId: string
  command: string
  status: string
  createdAt: string
}

interface DeviceApiResponse {
  id?: string | number
  tracker_id?: string
  trackerID?: string
  trackerId?: string
  name?: string
  vehicle_name?: string
  vehicleName?: string
  owner?: string
  owner_name?: string
  latitude?: number | string | null
  longitude?: number | string | null
  lat?: number | string | null
  lng?: number | string | null
  last_latitude?: number | string | null
  last_longitude?: number | string | null
  speed?: number | string | null
  last_speed?: number | string | null
  status?: 'online' | 'offline'
  is_active?: number | boolean
  isActive?: number | boolean
  online?: boolean
  battery?: number | string | null
  timestamp?: string
  last_timestamp?: string
  created_at?: string
  latestPosition?: {
    packetTime?: string
    latitude?: number | string | null
    longitude?: number | string | null
    speedKmh?: number | string | null
  }
}

interface LatestByDeviceApiResponse {
  id?: string | number
  device_id?: string | number
  packet_time?: string
  latitude?: number | string | null
  longitude?: number | string | null
  speed_kmh?: number | string | null
}

interface PositionApiResponse {
  id?: string | number
  latitude?: number | string | null
  longitude?: number | string | null
  speed?: number | string | null
  timestamp?: string
  created_at?: string
}

interface TripApiResponse {
  id?: string | number
  startTime?: string
  endTime?: string
  start_time?: string
  end_time?: string
  started_at?: string
  ended_at?: string
  distance?: number | string | null
  distance_km?: number | string | null
  duration?: number | string | null
  averageSpeed?: number | string | null
  average_speed?: number | string | null
  avg_speed_kmh?: number | string | null
}

interface EventApiResponse {
  id?: string | number
  type?: string
  event_type?: string
  eventType?: string
  description?: string
  message?: string
  timestamp?: string
  createdAt?: string
  eventTime?: string
  occurred_at?: string
  occurredAt?: string
  packetTime?: string
  time?: string | number
  event_time?: string
  packet_time?: string
  happened_at?: string
  created_at?: string
  latitude?: number | string | null
  longitude?: number | string | null
  lat?: number | string | null
  lng?: number | string | null
  metadata?: {
    packet_time?: string
    packetTime?: string
    time?: string | number
  }
  payload?: {
    packet_time?: string
    packetTime?: string
    time?: string | number
  }
}

interface CommandApiResponse {
  id?: string | number
  deviceId?: string | number
  device_id?: string | number
  command?: string | CommandApiResponse
  command_type?: string
  command_payload?: string
  tracker_id?: string
  status?: string
  queued_at?: string
  createdAt?: string
  created_at?: string
}

interface CommandActionApiResponse {
  message?: string
  dispatch?: unknown
  command?: CommandApiResponse
}

class APIClient {
  private baseUrl: string
  private token: string | null = null

  constructor() {
    this.baseUrl = BASE_URL
  }

  setToken(token: string | null) {
    this.token = token
  }

  private getHeaders() {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }
    return headers
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...(options.headers as HeadersInit),
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, clear it
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
      throw new Error(`API Error: ${response.statusText}`)
    }

    return response.json()
  }

  private toNumber(value: unknown): number | undefined {
    if (value === null || value === undefined) return undefined
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  private normalizeDevice(raw: DeviceApiResponse): Device {
    const isActive = raw.is_active === 1 || raw.is_active === true || raw.isActive === 1 || raw.isActive === true
    const isOnline = raw.online ?? undefined
    const trackerID = String(raw.tracker_id ?? raw.trackerID ?? raw.trackerId ?? raw.id ?? '')
    const latestLatitude = this.toNumber(raw.latestPosition?.latitude)
    const latestLongitude = this.toNumber(raw.latestPosition?.longitude)
    const latestSpeed = this.toNumber(raw.latestPosition?.speedKmh)

    return {
      id: String(raw.id ?? trackerID),
      trackerID,
      name: raw.name ?? raw.vehicle_name ?? raw.vehicleName ?? `Device ${trackerID}`,
      vehicleName: raw.vehicle_name ?? raw.vehicleName,
      owner: raw.owner ?? raw.owner_name,
      latitude: this.toNumber(raw.latitude ?? raw.lat ?? raw.last_latitude) ?? latestLatitude,
      longitude: this.toNumber(raw.longitude ?? raw.lng ?? raw.last_longitude) ?? latestLongitude,
      speed: this.toNumber(raw.speed ?? raw.last_speed) ?? latestSpeed ?? 0,
      status: raw.status ?? (isOnline !== undefined ? (isOnline ? 'online' : 'offline') : isActive ? 'online' : 'offline'),
      battery: this.toNumber(raw.battery),
      timestamp:
        raw.timestamp ?? raw.last_timestamp ?? raw.latestPosition?.packetTime ?? raw.created_at ?? new Date().toISOString(),
    }
  }

  private normalizePosition(raw: PositionApiResponse): Position {
    return {
      id: String(raw.id ?? ''),
      latitude: this.toNumber(raw.latitude) ?? 0,
      longitude: this.toNumber(raw.longitude) ?? 0,
      speed: this.toNumber(raw.speed) ?? 0,
      timestamp: raw.timestamp ?? raw.created_at ?? new Date().toISOString(),
    }
  }

  private normalizeTrip(raw: TripApiResponse): Trip {
    return {
      id: String(raw.id ?? ''),
      startTime:
        raw.startTime ||
        raw.start_time ||
        raw.started_at ||
        new Date().toISOString(),
      endTime:
        raw.endTime ||
        raw.end_time ||
        raw.ended_at ||
        new Date().toISOString(),
      distance:
        this.toNumber(raw.distance) ??
        this.toNumber((raw as any).distance_km) ??
        0,
      duration: this.toNumber(raw.duration) ?? 0,
      averageSpeed:
        this.toNumber(raw.averageSpeed) ??
        this.toNumber((raw as any).average_speed) ??
        this.toNumber((raw as any).avg_speed_kmh) ??
        0,
    }
  }

  private normalizeEvent(raw: EventApiResponse): Event {
    const timestampCandidate =
      this.coerceTimestamp(raw.timestamp) ??
      this.coerceTimestamp(raw.event_time) ??
      this.coerceTimestamp(raw.eventTime) ??
      this.coerceTimestamp(raw.packet_time) ??
      this.coerceTimestamp(raw.packetTime) ??
      this.coerceTimestamp(raw.happened_at) ??
      this.coerceTimestamp(raw.occurred_at) ??
      this.coerceTimestamp(raw.occurredAt) ??
      this.coerceTimestamp(raw.created_at) ??
      this.coerceTimestamp(raw.createdAt) ??
      this.coerceTimestamp(raw.time) ??
      this.coerceTimestamp(raw.metadata?.packet_time) ??
      this.coerceTimestamp(raw.metadata?.packetTime) ??
      this.coerceTimestamp(raw.metadata?.time) ??
      this.coerceTimestamp(raw.payload?.packet_time) ??
      this.coerceTimestamp(raw.payload?.packetTime) ??
      this.coerceTimestamp(raw.payload?.time)

    return {
      id: String(raw.id ?? ''),
      type: raw.type ?? raw.event_type ?? raw.eventType ?? 'event',
      description: raw.description ?? raw.message ?? '',
      timestamp: timestampCandidate ?? '',
      latitude: this.toNumber(raw.latitude ?? raw.lat),
      longitude: this.toNumber(raw.longitude ?? raw.lng),
    }
  }

  private coerceTimestamp(value: unknown): string | undefined {
    if (value === null || value === undefined) return undefined

    if (typeof value === 'number') {
      // Unix seconds or milliseconds.
      const ms = value < 1e12 ? value * 1000 : value
      const date = new Date(ms)
      return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
    }

    if (typeof value !== 'string') return undefined
    const trimmed = value.trim()
    if (!trimmed) return undefined

    // Numeric string: unix seconds or milliseconds.
    if (/^\d+$/.test(trimmed)) {
      const numeric = Number(trimmed)
      if (!Number.isFinite(numeric)) return undefined
      const ms = numeric < 1e12 ? numeric * 1000 : numeric
      const date = new Date(ms)
      return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
    }

    return trimmed
  }

  private normalizeCommand(raw: CommandApiResponse): Command {
    const nested =
      raw.command && typeof raw.command === 'object' && !Array.isArray(raw.command)
        ? (raw.command as CommandApiResponse)
        : null
    const source = nested ?? raw

    const commandLabel =
      (typeof source.command === 'string' ? source.command : undefined) ??
      source.command_type ??
      source.command_payload ??
      'unknown'

    return {
      id: String(source.id ?? ''),
      deviceId: String(source.deviceId ?? source.device_id ?? ''),
      command: commandLabel,
      status: source.status ?? 'pending',
      createdAt: source.createdAt ?? source.created_at ?? source.queued_at ?? new Date().toISOString(),
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async register(username: string, email: string, password: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    })
  }

  async getMe() {
    return this.request('/me', { method: 'GET' })
  }

  // Device endpoints
  async getDevices() {
    const data = await this.request<DeviceApiResponse[]>('/me/devices', { method: 'GET' })
    return data.map((device) => this.normalizeDevice(device))
  }

  async getDeviceStatus(deviceId: string) {
    const data = await this.request<DeviceApiResponse>(`/devices/${deviceId}/status`, { method: 'GET' })
    return this.normalizeDevice(data)
  }

  async registerDevice(trackerID: string, name: string) {
    const data = await this.request<DeviceApiResponse>('/me/devices/register', {
      method: 'POST',
      body: JSON.stringify({ tracker_id: trackerID, name }),
    })
    return this.normalizeDevice(data)
  }

  async updateDeviceProfile(
    deviceId: string,
    payload: { name?: string; vehicleName?: string }
  ) {
    const body: Record<string, string> = {}
    if (payload.name !== undefined) body.name = payload.name
    if (payload.vehicleName !== undefined) body.vehicleName = payload.vehicleName

    const data = await this.request<{ device?: DeviceApiResponse } | DeviceApiResponse>(
      `/me/devices/${deviceId}`,
      {
        method: 'PUT',
        body: JSON.stringify(body),
      }
    )

    const normalizedSource: DeviceApiResponse =
      (data as { device?: DeviceApiResponse }).device ?? (data as DeviceApiResponse)
    return this.normalizeDevice(normalizedSource)
  }

  // Tracking endpoints
  async getLatestPositions() {
    const data = await this.request<DeviceApiResponse[]>('/me/map/devices', { method: 'GET' })
    return data.map((device) => this.normalizeDevice(device))
  }

  async getLatestByDeviceId(deviceId: string) {
    const data = await this.request<LatestByDeviceApiResponse>(`/devices/${deviceId}/latest`, { method: 'GET' })
    return {
      id: String(data.device_id ?? deviceId),
      trackerID: '',
      name: '',
      latitude: this.toNumber(data.latitude),
      longitude: this.toNumber(data.longitude),
      speed: this.toNumber(data.speed_kmh) ?? 0,
      status: 'offline' as const,
      timestamp: data.packet_time ?? new Date().toISOString(),
    }
  }

  async getPositions(deviceId: string, limit: number = 100) {
    const data = await this.request<PositionApiResponse[]>(
      `/devices/${deviceId}/positions?limit=${limit}`,
      { method: 'GET' }
    )
    return data.map((position) => this.normalizePosition(position))
  }

  async getTrips(deviceId: string) {
    const data = await this.request<TripApiResponse[]>(`/devices/${deviceId}/trips`, { method: 'GET' })
    return data.map((trip) => this.normalizeTrip(trip))
  }

  async getEvents(deviceId: string) {
    const data = await this.request<EventApiResponse[]>(`/devices/${deviceId}/events`, { method: 'GET' })
    return data.map((event) => this.normalizeEvent(event))
  }

  // Command endpoints
  async engineStop(deviceId: string) {
    const data = await this.request<CommandActionApiResponse>(`/devices/${deviceId}/commands/engine-stop`, {
      method: 'POST',
    })
    return this.normalizeCommand(data.command ?? {})
  }

  async engineResume(deviceId: string) {
    const data = await this.request<CommandActionApiResponse>(`/devices/${deviceId}/commands/engine-resume`, {
      method: 'POST',
    })
    return this.normalizeCommand(data.command ?? {})
  }

  async getCommands(deviceId: string) {
    const data = await this.request<CommandApiResponse[]>(`/devices/${deviceId}/commands`, { method: 'GET' })
    return data.map((command) => this.normalizeCommand(command))
  }

  // Sharing endpoints
  async shareDevice(deviceId: string, username: string) {
    return this.request(`/me/devices/${deviceId}/share`, {
      method: 'POST',
      body: JSON.stringify({ userId: Number(username) }),
    })
  }

  async unshareDevice(deviceId: string, username: string) {
    return this.request(`/me/devices/${deviceId}/share/${username}`, {
      method: 'DELETE',
    })
  }
}

export const apiClient = new APIClient()
