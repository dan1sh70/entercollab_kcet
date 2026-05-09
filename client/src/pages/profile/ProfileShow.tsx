import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { avatarUrl, timeAgo } from '../../lib/utils';
import api from '../../lib/api';
import { showToast } from '../../components/layout/Toast';
import { APP_EVENTS, emitFollowChanged } from '../../lib/events';

type TabKey = 'projects' | 'research' | 'collabs';

function memberSince(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

export default function ProfileShow() {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const { user: authUser, loading: authLoading } = useAuth();
  const profileId = paramId ? parseInt(paramId, 10) : authUser?.id;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('projects');

  useEffect(() => {
    if (authLoading) return;
    if (!profileId || Number.isNaN(profileId)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api.get(`/profile/${profileId}`).then((res) => setData(res.data)).catch(() => setData(null)).finally(() => setLoading(false));
  }, [profileId, authLoading]);

  useEffect(() => {
    if (authLoading || !profileId || Number.isNaN(profileId) || authUser?.id !== profileId) return;
    const onFollowChanged = () => {
      api.get(`/profile/${profileId}`).then((res) => setData(res.data)).catch(() => {});
    };
    window.addEventListener(APP_EVENTS.followChanged, onFollowChanged);
    return () => window.removeEventListener(APP_EVENTS.followChanged, onFollowChanged);
  }, [profileId, authUser?.id, authLoading]);

  const toggleFollow = async () => {
    if (!profileId) return;
    try {
      const res = await api.post(`/feed/users/${profileId}/follow`);
      setData((prev: any) => ({
        ...prev,
        isFollowing: res.data.following,
        followersCount: prev.followersCount + (res.data.following ? 1 : -1),
      }));
      emitFollowChanged();
    } catch {
      showToast('Failed to follow', 'error');
    }
  };

  const openDirectMessage = async () => {
    const targetId = data?.user?.id;
    if (!authUser || !targetId || targetId === authUser.id) return;
    try {
      const res = await api.post(`/chat/direct/${targetId}`);
      const roomId = res.data?.room?.id;
      if (roomId != null) {
        navigate(`/chat?room=${roomId}`);
      }
    } catch {
      showToast('Could not open messages', 'error');
    }
  };

  if (authLoading || (loading && profileId)) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;
  }

  if (!profileId || Number.isNaN(profileId)) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>Sign in to view your profile.</p>
        <Link to="/login" className="text-indigo-600 text-sm font-semibold mt-2 inline-block">Log in</Link>
      </div>
    );
  }

  if (!loading && !data) {
    return <div className="p-6 text-center text-gray-500">User not found</div>;
  }

  if (!data) return null;

  const {
    user,
    projects = [],
    researchPapers = [],
    collabs = [],
    followersCount,
    followingCount,
    projectsCount,
    researchCount = 0,
    collabsCount = 0,
    isFollowing,
  } = data;

  const isOwnProfile = authUser?.id === user.id;
  const skills = user.skills ? user.skills.split(',').map((s: string) => s.trim()).filter(Boolean) : [];

  const headlineParts = [user.university, user.major].filter(Boolean);
  const headline = headlineParts.join(' · ');

  return (
    <div className="h-full overflow-y-auto custom-scrollbar pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Profile header card (no cover photo) */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 sm:px-6 pt-5 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
              <div className="relative flex-shrink-0">
                <img
                  src={avatarUrl(user.name, user.profilePhotoPath)}
                  alt=""
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl border-2 border-gray-200 object-cover bg-gray-50 shadow-sm"
                />
                <div className="absolute bottom-1 right-1 bg-indigo-600 text-white w-7 h-7 flex items-center justify-center rounded-full border-2 border-white text-xs">
                  <i className="fa-solid fa-check" />
                </div>
              </div>

              <div className="flex-1 min-w-0 pt-1 sm:pb-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{user.name}</h1>
                {headline && <p className="text-sm text-gray-600 mt-1">{headline}</p>}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs sm:text-sm text-gray-500">
                  {user.location && (
                    <span className="inline-flex items-center gap-1">
                      <i className="fa-solid fa-location-dot text-indigo-500" /> {user.location}
                    </span>
                  )}
                  {user.nationality && (
                    <span className="inline-flex items-center gap-1">
                      <i className="fa-solid fa-flag text-indigo-500" /> {user.nationality}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <i className="fa-regular fa-calendar text-indigo-500" /> Joined {memberSince(user.createdAt)}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 sm:ml-auto sm:shrink-0">
                {isOwnProfile && (
                  <Link
                    to="/profile/edit"
                    className="px-4 py-2 bg-white text-gray-900 text-sm font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 inline-flex items-center gap-2"
                  >
                    <i className="fa-solid fa-pen text-[10px]" /> Edit profile
                  </Link>
                )}
                {!isOwnProfile && (
                  <button
                    type="button"
                    onClick={toggleFollow}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${
                      isFollowing ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    <i className={isFollowing ? 'fa-solid fa-user-check' : 'fa-solid fa-user-plus'} />
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}
                {!isOwnProfile && (
                  <button
                    type="button"
                    onClick={() => void openDirectMessage()}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 flex items-center gap-2"
                  >
                    <i className="fa-regular fa-envelope" /> Message
                  </button>
                )}
              </div>
            </div>

            {/* Social */}
            <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
              {user.githubHandle && (
                <a href={`https://github.com/${user.githubHandle}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-900" aria-label="GitHub">
                  <i className="fa-brands fa-github text-lg" />
                </a>
              )}
              {user.linkedinHandle && (
                <a href={`https://linkedin.com/in/${user.linkedinHandle}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#0077b5]" aria-label="LinkedIn">
                  <i className="fa-brands fa-linkedin text-lg" />
                </a>
              )}
              {user.twitterHandle && (
                <a href={`https://twitter.com/${user.twitterHandle}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-900" aria-label="Twitter">
                  <i className="fa-brands fa-twitter text-lg" />
                </a>
              )}
              {user.website && (
                <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-indigo-600" aria-label="Website">
                  <i className="fa-solid fa-globe text-lg" />
                </a>
              )}
            </div>
          </div>

          {/* Stats (clickable) */}
          <div className="grid grid-cols-3 gap-px bg-gray-100 border-t border-gray-100">
            <button type="button" onClick={() => setActiveTab('projects')} className="bg-white px-3 py-3 text-center hover:bg-gray-50 transition-colors">
              <p className="text-lg font-bold text-gray-900">{projectsCount}</p>
              <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide">Projects</p>
            </button>
            <Link to={isOwnProfile ? '/profile/followers' : `/profile/${user.id}/followers`} className="bg-white px-3 py-3 text-center hover:bg-gray-50 transition-colors">
              <p className="text-lg font-bold text-gray-900">{followersCount}</p>
              <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide">Followers</p>
            </Link>
            <Link to={isOwnProfile ? '/profile/following' : `/profile/${user.id}/following`} className="bg-white px-3 py-3 text-center hover:bg-gray-50 transition-colors">
              <p className="text-lg font-bold text-gray-900">{followingCount}</p>
              <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide">Following</p>
            </Link>
          </div>
        </div>

        {/* About */}
        <section className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-1 h-5 bg-indigo-600 rounded-full" />
            About
          </h2>
          {user.bio ? (
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{user.bio}</p>
          ) : (
            <p className="text-sm text-gray-400 italic">{isOwnProfile ? 'Add a short bio so others know you better — edit your profile.' : 'No about section yet.'}</p>
          )}
          {isOwnProfile && user.email && (
            <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
              <span className="font-semibold text-gray-700">Email</span> · {user.email}
            </p>
          )}
        </section>

        {/* Education (LinkedIn-style) */}
        <section className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-indigo-600 rounded-full" />
            Education
          </h2>
          {(user.university || user.major) ? (
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <i className="fa-solid fa-graduation-cap text-indigo-600 text-xl" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900">{user.university || 'Institution'}</h3>
                {user.major && <p className="text-sm text-gray-600 mt-0.5">{user.major}</p>}
                <p className="text-xs text-gray-400 mt-1">Member since {memberSince(user.createdAt)}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">{isOwnProfile ? 'Add your school and field of study in profile settings.' : 'No education listed.'}</p>
          )}
        </section>

        {/* Skills */}
        <section className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-1 h-5 bg-indigo-600 rounded-full" />
            Skills
          </h2>
          {skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill: string, i: number) => (
                <span
                  key={i}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-full border border-slate-200/80 transition-colors"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">{isOwnProfile ? 'Show what you are good at — add skills when you edit your profile.' : 'No skills listed yet.'}</p>
          )}
        </section>

        {/* Tabs */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {(
              [
                { key: 'projects' as const, label: 'Projects', count: projectsCount },
                { key: 'research' as const, label: 'Research', count: researchCount },
                { key: 'collabs' as const, label: 'Collabs', count: collabsCount },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 min-w-[100px] px-3 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {tab.label}
                <span className="ml-1.5 text-xs font-bold text-gray-400 tabular-nums">({tab.count})</span>
              </button>
            ))}
          </div>

          <div className="p-4 sm:p-5">
            {activeTab === 'projects' && (
              <div className="space-y-3">
                {projects.length > 0 ? (
                  projects.map((project: any) => (
                    <div
                      key={project.id}
                      className="w-full text-left bg-gray-50 hover:bg-indigo-50/50 border border-gray-100 hover:border-indigo-200 rounded-xl p-4 flex flex-col sm:flex-row gap-4 transition"
                    >
                      {project.image ? (
                        <div className="sm:w-40 aspect-video rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                          <img src={project.image} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="sm:w-40 aspect-video rounded-lg bg-indigo-50 flex-shrink-0 flex items-center justify-center border border-indigo-100">
                          <i className="fa-solid fa-layer-group text-2xl text-indigo-300" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Project</span>
                          <span className="text-gray-400 text-xs">{timeAgo(project.createdAt)}</span>
                        </div>
                        <h3 className="font-semibold text-gray-900">{project.title}</h3>
                        {project.content && <p className="text-sm text-gray-600 line-clamp-2 mt-1">{project.content}</p>}
                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                          <span><i className="fa-regular fa-heart mr-1" />{project.likes_count ?? 0}</span>
                          <span><i className="fa-regular fa-comment mr-1" />{project.comments_count ?? 0}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:justify-start sm:pl-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/projects/${project.id}`)}
                          className="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-50"
                        >
                          View
                        </button>
                        {isOwnProfile && (
                          <button
                            type="button"
                            onClick={() => navigate(`/projects/${project.id}/edit`)}
                            className="px-3 py-2 bg-white border border-indigo-200 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-50"
                          >
                            <i className="fa-solid fa-pen-to-square mr-1" /> Edit
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyTab message="No projects yet." isOwn={isOwnProfile} actionLabel="Create a project" actionTo="/projects/create" />
                )}
              </div>
            )}

            {activeTab === 'research' && (
              <div className="space-y-3">
                {researchPapers.length > 0 ? (
                  researchPapers.map((paper: any) => (
                    <button
                      key={paper.id}
                      type="button"
                      onClick={() => navigate(`/research/${paper.id}`)}
                      className="w-full text-left bg-gray-50 hover:bg-violet-50/50 border border-gray-100 hover:border-violet-200 rounded-xl p-4 transition"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                          <i className="fa-solid fa-file-lines text-violet-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900">{paper.title}</h3>
                          {paper.field && <p className="text-xs text-violet-600 font-medium mt-0.5">{paper.field}</p>}
                          {paper.abstract && <p className="text-sm text-gray-600 line-clamp-2 mt-1">{paper.abstract}</p>}
                          <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                            {paper.status && paper.status !== 'published' && (
                              <span className="capitalize">{paper.status}</span>
                            )}
                            {paper.publicationDate && <span>{new Date(paper.publicationDate).getFullYear()}</span>}
                            {paper.citations != null && <span>{paper.citations} citations</span>}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <EmptyTab message="No research papers yet." isOwn={isOwnProfile} actionLabel="Add research" actionTo="/research/create" />
                )}
              </div>
            )}

            {activeTab === 'collabs' && (
              <div className="space-y-3">
                {collabs.length > 0 ? (
                  collabs.map((item: any) => {
                    const post = item.post;
                    if (!post) return null;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => navigate(`/projects/${post.id}`)}
                        className="w-full text-left bg-gray-50 hover:bg-amber-50/50 border border-gray-100 hover:border-amber-200 rounded-xl p-4 transition"
                      >
                        <div className="flex items-start gap-3">
                          {post.image ? (
                            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                              <img src={post.image} alt="" className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 border border-amber-100">
                              <i className="fa-solid fa-people-group text-amber-600" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-bold uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded">Collaboration</span>
                            <h3 className="font-semibold text-gray-900 mt-1">{post.title}</h3>
                            {post.user && (
                              <p className="text-xs text-gray-500 mt-1">
                                Led by{' '}
                                <span className="font-medium text-gray-700">{post.user.name}</span>
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">Joined {timeAgo(item.joinedAt)}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <EmptyTab message="No collaborations yet — join projects to show them here." isOwn={isOwnProfile} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyTab({ message, isOwn, actionLabel, actionTo }: { message: string; isOwn: boolean; actionLabel?: string; actionTo?: string }) {
  return (
    <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
      <i className="fa-solid fa-inbox text-3xl text-gray-300 mb-3 block" />
      <p className="text-gray-500 text-sm">{message}</p>
      {isOwn && actionLabel && actionTo && (
        <Link to={actionTo} className="inline-block mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-800">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
