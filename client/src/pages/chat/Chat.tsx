import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { getSocket } from '../../lib/socket';
import { avatarUrl, timeAgo } from '../../lib/utils';
import api from '../../lib/api';

interface Room {
  id: number;
  name: string | null;
  post?: { id: number; title: string | null } | null;
  users: { user: { id: number; name: string; profilePhotoPath: string | null } }[];
}
interface Message {
  id: number;
  content: string;
  createdAt: string;
  user: { id: number; name: string; profilePhotoPath: string | null };
}

export default function Chat() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { on, joinRoom, leaveRoom } = useSocket();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeRoomRef = useRef<number | null>(null);
  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  const loadRooms = useCallback(() => {
    return api.get('/chat').then((res) => setRooms(res.data.rooms || []));
  }, []);

  const clearRoom = useCallback(() => {
    setActiveRoom((prev) => {
      if (prev) leaveRoom(prev);
      return null;
    });
    setMessages([]);
    setSearchParams((p) => {
      const next = new URLSearchParams(p);
      next.delete('room');
      return next;
    });
  }, [leaveRoom, setSearchParams]);

  useEffect(() => {
    loadRooms().finally(() => setLoading(false));
    const cleanupMsg = on('message:receive', (data: any) => {
      const roomId = typeof data?.roomId === 'number' ? data.roomId : null;
      const msg: Message | undefined =
        data?.message != null ? data.message : data?.id != null ? data : undefined;
      if (!msg?.id) return;
      const open = activeRoomRef.current;
      if (roomId != null) {
        if (open === roomId) {
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        } else {
          void loadRooms();
        }
        return;
      }
      if (open != null) {
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      }
    });
    const cleanupRefresh = on('chat:rooms:refresh', () => {
      void loadRooms();
    });
    return () => {
      cleanupMsg();
      cleanupRefresh();
    };
  }, [on, loadRooms]);

  useEffect(() => {
    const socket = getSocket();
    const rejoin = () => {
      const id = activeRoomRef.current;
      if (id != null) joinRoom(id);
    };
    socket.on('connect', rejoin);
    return () => {
      socket.off('connect', rejoin);
    };
  }, [joinRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectRoom = useCallback(
    async (roomId: number, syncUrl = true) => {
      setActiveRoom((prev) => {
        if (prev) leaveRoom(prev);
        return roomId;
      });
      joinRoom(roomId);
      if (syncUrl) {
        setSearchParams((p) => {
          const next = new URLSearchParams(p);
          next.set('room', String(roomId));
          return next;
        });
      }
      const res = await api.get(`/chat/${roomId}/messages`);
      setMessages(res.data.messages);
    },
    [joinRoom, leaveRoom, setSearchParams]
  );

  useEffect(() => {
    if (loading || rooms.length === 0) return;
    const param = searchParams.get('room');
    if (!param) return;
    const id = parseInt(param, 10);
    if (Number.isNaN(id) || !rooms.some((r) => r.id === id)) return;
    if (activeRoom === id) return;
    void selectRoom(id, false);
  }, [loading, rooms, searchParams, activeRoom, selectRoom]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeRoom) return;
    const res = await api.post(`/chat/${activeRoom}/send`, { content: input });
    const msg = res.data.message;
    setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    setInput('');
  };

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 py-12">
        <div className="relative">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 opacity-20 animate-pulse" />
          <i className="fa-solid fa-comments absolute inset-0 flex items-center justify-center text-lg text-indigo-600" />
        </div>
        <div className="space-y-1.5 text-center">
          <p className="text-xs font-semibold text-slate-700 tracking-tight">Loading messages</p>
          <p className="text-[11px] text-slate-500">Fetching your conversations</p>
        </div>
      </div>
    );
  }

  const activeRoomData = rooms.find((r) => r.id === activeRoom);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-slate-100/80 lg:flex-row">
      {/* Sidebar — conversations (WhatsApp-style list: scrolls independently) */}
      <aside
        className={`
          flex min-h-0 flex-shrink-0 flex-col overflow-hidden bg-white
          w-full lg:w-[min(100%,300px)] xl:w-[340px]
          border-slate-200/90
          max-lg:border-b lg:border-r lg:border-b-0
          ${activeRoom ? 'max-lg:hidden' : 'flex'}
          lg:flex
          max-lg:flex-1
          shadow-[inset_-1px_0_0_rgba(15,23,42,0.06)]
        `}
      >
        <div className="shrink-0 border-b border-slate-100 bg-gradient-to-b from-white to-slate-50/90 px-3 pb-3 pt-3 sm:px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-md shadow-indigo-500/20">
              <i className="fa-solid fa-message text-sm" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-bold leading-tight tracking-tight text-slate-900">Messages</h1>
              <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                {rooms.length === 0 ? 'No conversations yet' : `${rooms.length} conversation${rooms.length === 1 ? '' : 's'}`}
              </p>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2 custom-scrollbar sm:p-3">
          {rooms.length === 0 ? (
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 py-10 text-center ring-1 ring-slate-900/5">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200/80">
                <i className="fa-solid fa-inbox text-lg text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-800">No project chats yet</p>
              <p className="mx-auto mt-1.5 max-w-[260px] text-xs leading-relaxed text-slate-500">
                Join a project, get approved by the owner, and your team chat will show up here.
              </p>
              <Link
                to="/projects"
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-slate-800"
              >
                Browse projects
                <i className="fa-solid fa-arrow-right text-xs opacity-80" />
              </Link>
            </div>
          ) : (
            <ul className="space-y-1">
              {rooms.map((room) => {
                const active = activeRoom === room.id;
                const title = room.post?.title || room.name || 'Project chat';
                const subtitle = room.name && room.post?.title ? room.name : null;
                const members = room.users
                  .slice(0, 4)
                  .map((u) => u.user.name)
                  .join(', ');
                const more = room.users.length > 4 ? ` +${room.users.length - 4}` : '';

                return (
                  <li key={room.id}>
                    <button
                      type="button"
                      onClick={() => selectRoom(room.id)}
                      className={`
                        group w-full rounded-lg px-2.5 py-2 text-left transition-all duration-200
                        focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2
                        ${
                          active
                            ? 'bg-indigo-50 ring-1 ring-indigo-200/80 shadow-sm'
                            : 'hover:bg-slate-50 active:bg-slate-100/80'
                        }
                      `}
                    >
                      <div className="flex gap-2.5">
                        <div
                          className={`
                          flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold
                          ${
                            active
                              ? 'bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-md shadow-indigo-500/20'
                              : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-100/80 group-hover:text-indigo-800'
                          }
                        `}
                        >
                          {(room.name || room.post?.title || 'C').slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1 pt-0.5">
                          <p
                            className={`truncate text-sm font-semibold leading-snug ${
                              active ? 'text-indigo-950' : 'text-slate-900'
                            }`}
                          >
                            {title}
                          </p>
                          {subtitle && (
                            <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500">{subtitle}</p>
                          )}
                          <p className="mt-1 truncate text-[10px] text-slate-400">
                            <span className="inline-flex items-center gap-1">
                              <i className="fa-solid fa-users text-[9px] opacity-70" aria-hidden />
                              {members}
                              {more}
                            </span>
                          </p>
                        </div>
                        {active && (
                          <span className="h-6 w-1 shrink-0 self-center rounded-full bg-indigo-600" aria-hidden />
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* Thread: header + scrollable messages + fixed composer (LinkedIn / WhatsApp pattern) */}
      <section
        className={`
          flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#e5e7eb] lg:bg-[#f8fafc]
          ${!activeRoom ? 'max-lg:hidden' : 'flex'}
          lg:flex
        `}
      >
        {!activeRoom ? (
          <div className="hidden min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto bg-gradient-to-b from-slate-50 to-[#f8fafc] px-8 py-12 text-center lg:flex">
            <div className="relative mb-6">
              <div className="absolute inset-0 scale-110 rounded-[2rem] bg-gradient-to-br from-indigo-400/20 to-violet-500/20 blur-2xl" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg shadow-slate-200/80 ring-1 ring-slate-200/80">
                <i className="fa-regular fa-comments bg-gradient-to-br from-indigo-600 to-violet-600 bg-clip-text text-3xl text-transparent" />
              </div>
            </div>
            <h2 className="text-base font-bold tracking-tight text-slate-900">Select a conversation</h2>
            <p className="mt-1.5 max-w-md text-xs leading-relaxed text-slate-500">
              Choose a project chat from the list to view messages and collaborate with your team in real time.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5 text-[10px] text-slate-400">
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 shadow-sm ring-1 ring-slate-200/80">
                <i className="fa-solid fa-bolt text-amber-500" />
                Live updates
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 shadow-sm ring-1 ring-slate-200/80">
                <i className="fa-solid fa-lock text-slate-400" />
                Project members only
              </span>
            </div>
          </div>
        ) : (
          <>
            <header className="z-10 shrink-0 border-b border-slate-200/90 bg-white px-2.5 py-2.5 shadow-sm shadow-slate-900/5 sm:px-4">
              <div className="mx-auto flex w-full max-w-5xl items-center gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={clearRoom}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 lg:hidden"
                  aria-label="Back to conversations"
                >
                  <i className="fa-solid fa-arrow-left text-sm" />
                </button>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 text-sm font-bold text-white shadow-md shadow-indigo-500/20">
                  {(activeRoomData?.post?.title || activeRoomData?.name || '?').slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-bold tracking-tight text-slate-900 sm:text-base">
                    {activeRoomData?.post?.title || activeRoomData?.name || 'Chat'}
                  </h2>
                  {activeRoomData?.post?.id && (
                    <Link
                      to={`/projects/${activeRoomData.post.id}`}
                      className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 transition-colors hover:text-indigo-800"
                    >
                      <i className="fa-solid fa-diagram-project text-[9px] opacity-80" />
                      Open project
                    </Link>
                  )}
                </div>
              </div>
            </header>

            <div
              className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, rgb(203 213 225 / 0.45) 1px, transparent 0)`,
                backgroundSize: '20px 20px',
              }}
            >
              <div className="mx-auto flex min-h-full max-w-3xl flex-col px-2.5 py-3 sm:px-4 sm:py-4">
                {messages.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200/80">
                      <i className="fa-regular fa-paper-plane text-lg text-slate-400" />
                    </div>
                    <p className="text-xs font-semibold text-slate-700">No messages yet</p>
                    <p className="mt-1 max-w-xs text-[11px] leading-relaxed text-slate-500">
                      Start the conversation — your message will appear here instantly for everyone in this chat.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg, idx) => {
                      const mine = msg.user.id === user?.id;
                      const prev = messages[idx - 1];
                      const next = messages[idx + 1];
                      const showTheirAvatar =
                        !mine && (idx === 0 || prev?.user?.id !== msg.user.id);
                      const showMineAvatar =
                        mine && (idx === messages.length - 1 || next?.user?.id !== msg.user.id);
                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-2 sm:gap-2.5 ${mine ? 'flex-row-reverse' : ''} ${!mine && !showTheirAvatar ? 'pl-10' : ''}`}
                        >
                          {!mine && (
                            <div className="flex w-8 shrink-0 flex-col justify-end">
                              {showTheirAvatar ? (
                                <img
                                  src={avatarUrl(msg.user.name, msg.user.profilePhotoPath)}
                                  alt=""
                                  className="h-8 w-8 rounded-full object-cover shadow-md ring-2 ring-white"
                                />
                              ) : (
                                <span className="w-8" aria-hidden />
                              )}
                            </div>
                          )}
                            <div
                              className={`flex max-w-[min(88%,26rem)] flex-col ${mine ? 'items-end' : 'items-start'}`}
                          >
                            {showTheirAvatar && !mine && (
                              <span className="mb-1 px-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                {msg.user.name}
                              </span>
                            )}
                            <div
                              className={`
                                rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm
                                ${
                                  mine
                                    ? 'rounded-br-md bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-indigo-500/20'
                                    : 'rounded-bl-md border border-slate-200/90 bg-white text-slate-800 shadow-slate-900/5'
                                }
                              `}
                            >
                              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                            </div>
                            <time
                              className={`mt-1 px-0.5 text-[9px] font-medium tabular-nums ${
                                mine ? 'text-indigo-300/90' : 'text-slate-400'
                              }`}
                              dateTime={msg.createdAt}
                            >
                              {timeAgo(msg.createdAt)}
                            </time>
                          </div>
                          {mine && (
                            <div className="flex w-8 shrink-0 flex-col justify-end">
                              {showMineAvatar ? (
                                <img
                                  src={avatarUrl(user?.name ?? '', user?.profilePhotoPath ?? null)}
                                  alt=""
                                  className="h-8 w-8 rounded-full object-cover shadow-md ring-2 ring-white"
                                />
                              ) : (
                                <span className="w-8" aria-hidden />
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                <div ref={messagesEndRef} className="h-px shrink-0" />
              </div>
            </div>

            <form
              onSubmit={sendMessage}
              className="shrink-0 border-t border-slate-200 bg-[#f0f2f5] px-2 pt-1.5 pb-1.5 sm:px-3 sm:pb-2"
            >
              <div className="mx-auto w-full max-w-3xl">
                <div className="flex items-end gap-1.5 rounded-xl border border-slate-200/90 bg-white px-2.5 py-1.5 shadow-sm focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-500/15">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Message"
                    autoComplete="off"
                    className="min-h-[44px] flex-1 border-0 bg-transparent py-2 text-sm leading-snug text-slate-900 placeholder:text-slate-400 focus:ring-0 sm:min-h-[40px]"
                    enterKeyHint="send"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-35"
                    aria-label="Send message"
                  >
                    <i className="fa-solid fa-paper-plane text-xs" />
                  </button>
                </div>
                <p className="mt-1 hidden text-center text-[9px] text-slate-400 sm:block">
                  Visible to everyone in this project chat.
                </p>
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
