import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/shared/PageHeader';
import { authApi } from '../api';
import {
  Search, Plus, Edit2, UserX, UserCheck, Loader2,
  X, Mail, Phone, Shield, Building2, UserCircle, Lock
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { showToast } from '@/lib/toast';

interface UserItem {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: string;
  isActive: boolean;
  lastLoginAt?: string | null;
  school?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

interface SchoolLookup {
  id: string;
  name: string;
  code: string;
}

export default function ManageUsersPage() {
  const { user: currentUser } = useAuthStore();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [schools, setSchools] = useState<SchoolLookup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('SCHOOL_ADMIN');
  const [schoolId, setSchoolId] = useState('');
  const [phone, setPhone] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Authorization check
  const isAuthorized = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'SCHOOL_ADMIN';

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await authApi.listUsers();
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to load users list.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSchools = async () => {
    try {
      const res = await authApi.getSchoolsLookup();
      if (res.data.success && res.data.data.length > 0) {
        setSchools(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load schools lookup:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchSchools();
  }, []);

  const handleOpenAddModal = () => {
    setModalType('add');
    setSelectedUser(null);
    setUsername('');
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setRole('SCHOOL_ADMIN');
    setSchoolId(currentUser?.schoolId || (schools.length > 0 ? schools[0].id : ''));
    setPhone('');
    setIsActive(true);
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: UserItem) => {
    setModalType('edit');
    setSelectedUser(user);
    setUsername(user.username);
    setEmail(user.email);
    setPassword(''); // Don't show password or require edit
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setRole(user.role);
    setSchoolId(user.school?.id || '');
    setPhone(user.phone || '');
    setIsActive(user.isActive);
    setModalError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setModalLoading(true);

    try {
      if (modalType === 'add') {
        const targetSchoolId = role === 'SUPER_ADMIN' ? null : (schoolId || (schools.length > 0 ? schools[0].id : null));
        const res = await authApi.createUser({
          username,
          email,
          password,
          firstName,
          lastName,
          role,
          schoolId: targetSchoolId,
          phone: phone || null,
        });
        if (res.data.success) {
          showToast('User created successfully!', 'success');
          setIsModalOpen(false);
          fetchUsers();
        }
      } else if (modalType === 'edit' && selectedUser) {
        const targetSchoolId = role === 'SUPER_ADMIN' ? null : (schoolId || (schools.length > 0 ? schools[0].id : null));
        const res = await authApi.updateUser(selectedUser.id, {
          email,
          firstName,
          lastName,
          role,
          schoolId: targetSchoolId,
          phone: phone || null,
          isActive,
        });
        if (res.data.success) {
          showToast('User details updated successfully!', 'success');
          setIsModalOpen(false);
          fetchUsers();
        }
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message || 'An error occurred. Please try again.';
      setModalError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleStatus = async (user: UserItem) => {
    if (!window.confirm(`Are you sure you want to ${user.isActive ? 'deactivate' : 'activate'} this user?`)) {
      return;
    }

    try {
      const res = await authApi.updateUser(user.id, {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        schoolId: user.school?.id || null,
        phone: user.phone || null,
        isActive: !user.isActive,
      });

      if (res.data.success) {
        showToast(`User @${user.username} ${user.isActive ? 'deactivated' : 'activated'} successfully!`, 'success');
        fetchUsers();
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to update user status.', 'error');
    }
  };

  // Search logic
  const filteredUsers = users.filter((u) => {
    const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return (
      fullName.includes(query) ||
      u.username.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.role.toLowerCase().includes(query) ||
      (u.school?.name && u.school.name.toLowerCase().includes(query))
    );
  });

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Shield className="h-16 w-16 text-red-500" />
        <h2 className="text-xl font-bold">Unauthorized Access</h2>
        <p className="text-muted-foreground text-center max-w-md">
          You do not have permission to view this page. User management is restricted to administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title="Manage Users"
          description="Create, view, edit, and deactivate user accounts in the system"
        />
        <Button onClick={handleOpenAddModal} className="shrink-0 bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Filters/Search Bar */}
          <div className="flex items-center gap-2 max-w-md">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, role, or school..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9"
            />
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/60 border-b">
                  <th className="p-3 text-left font-semibold">User Details</th>
                  <th className="p-3 text-left font-semibold">Role</th>
                  <th className="p-3 text-left font-semibold">Assigned School</th>
                  <th className="p-3 text-center font-semibold">Status</th>
                  <th className="p-3 text-center font-semibold">Last Login</th>
                  <th className="p-3 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      <div className="flex justify-center items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        <span>Loading users...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                            {user.firstName[0]?.toUpperCase()}{user.lastName[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">@{user.username} • {user.email}</p>
                            {user.phone && <p className="text-[11px] text-muted-foreground">{user.phone}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="capitalize text-xs">
                          {user.role.toLowerCase().replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <span className="text-sm font-medium text-foreground">
                          {user.school?.name || 'Corporate'}
                        </span>
                        {user.school?.code && (
                          <span className="text-xs text-muted-foreground block">
                            Code: {user.school.code}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <Badge
                          variant={user.isActive ? 'success' : 'destructive'}
                          className="text-xs"
                        >
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="p-3 text-center text-xs text-muted-foreground">
                        {user.lastLoginAt
                          ? formatDateTime(user.lastLoginAt)
                          : 'Never'}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditModal(user)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleStatus(user)}
                            className={`h-8 w-8 ${user.isActive
                              ? 'text-red-500 hover:bg-red-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                            title={user.isActive ? 'Deactivate user' : 'Activate user'}
                          >
                            {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Backdrop & Container */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b flex items-center justify-between bg-muted/20">
              <div>
                <h3 className="font-bold text-lg">
                  {modalType === 'add' ? 'Add New User' : 'Edit User Details'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {modalType === 'add' ? 'Create a new user account' : `Updating @${username}`}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-accent transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              {modalError && (
                <div className="p-3 rounded-lg text-sm border bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">First Name</label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Last Name</label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john.doe@example.com"
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Username</label>
                  <div className="relative">
                    <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="johndoe"
                      className="pl-9"
                      required
                      disabled={modalType === 'edit'}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Optional"
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              {/* Password field only visible on Add user */}
              {modalType === 'add' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full h-10 px-3 border rounded-lg text-sm bg-background"
                  >
                    {/* ONLY Super Admin can create Super Admins */}
                    {currentUser?.role === 'SUPER_ADMIN' && (
                      <option value="SUPER_ADMIN">Super Admin</option>
                    )}
                    <option value="SCHOOL_ADMIN">School Admin</option>
                    <option value="TEACHER">Teacher</option>
                    <option value="PARENT">Parent</option>
                  </select>
                </div>

                {/* School Dropdown: visible for Super Admin unless role is Super Admin */}
                {currentUser?.role === 'SUPER_ADMIN' && role !== 'SUPER_ADMIN' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Assign School</label>
                    <select
                      value={schoolId}
                      onChange={(e) => setSchoolId(e.target.value)}
                      className="w-full h-10 px-3 border rounded-lg text-sm bg-background"
                      required
                    >
                      <option value="">Select a School...</option>
                      {schools.map((school) => (
                        <option key={school.id} value={school.id}>
                          {school.name} ({school.code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={modalLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={modalLoading} className="bg-blue-600 hover:bg-blue-700">
                  {modalLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save User'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
