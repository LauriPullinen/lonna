import * as L from "lonna"
import { globalScope } from "lonna"
import io from "socket.io-client"
import { addOrReplaceEvent } from "../../../common/src/action-folding"
import { EventFromServer, isLocalUIEvent, UIEvent } from "../../../common/src/domain"
import { sleep } from "../../../common/src/sleep"
import MessageQueue from "./message-queue"

export type Dispatch = (e: UIEvent) => void

const SERVER_EVENTS_BUFFERING_MILLIS = 20

export type ServerConnection = ReturnType<typeof serverConnection>

export function serverConnection() {
    const uiEvents = L.bus<UIEvent>()
    const dispatch: Dispatch = uiEvents.push
    const serverEvents = L.bus<EventFromServer>()
    const bufferedServerEvents = serverEvents.pipe(
        L.bufferWithTime(SERVER_EVENTS_BUFFERING_MILLIS),
        L.flatMap((events) => {
            return L.fromArray(
                events.reduce((folded, next) => addOrReplaceEvent(next, folded), [] as EventFromServer[]),
            )
        }, globalScope),
    )

    const connected = L.atom(false)
    const messageQueue = MessageQueue(null)
    let socket = initSocket()

    async function reconnect(reconnectSocket: SocketIOClient.Socket) {
        await sleep(100)
        if (reconnectSocket === socket) {
            console.log("reconnecting")
            socket.connect()
        }
    }

    function initSocket() {
        console.log("New socket")
        const socket = io({ reconnection: true, reconnectionDelay: 100 })
        messageQueue.setSocket(socket)

        socket.on("connect", () => {
            console.log("Socket connected")
            messageQueue.onConnect()
            connected.set(true)
        })
        socket.on("disconnect", () => {
            console.log("Socket disconnected")
            connected.set(false)
            reconnect(socket)
        })
        socket.on("message", function (kind: string, event: EventFromServer) {
            if (kind === "app-event") {
                serverEvents.push(event)
            }
        })
        return socket
    }

    function newSocket() {
        console.log("New socket")
        socket.disconnect()
        socket = initSocket()
    }
    uiEvents.pipe(L.filter((e: UIEvent) => !isLocalUIEvent(e))).forEach(messageQueue.enqueue)

    // uiEvents.log("UI")
    // serverEvents.log("Server")

    const events = L.merge(uiEvents, bufferedServerEvents)

    return {
        uiEvents,
        messageQueue,
        bufferedServerEvents,
        dispatch,
        connected,
        events,
        queueSize: messageQueue.queueSize,
        newSocket,
    }
}
