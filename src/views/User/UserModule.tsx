import React, { useState } from "react";
import { FaUsers, FaUserShield, FaUserCog } from "react-icons/fa";
import UserCreation from "./UserCreation";
import UserRole from "./UserRoles";

// ===== Types =====
type User = {
  id: number;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  phone: string;
  dob: string;
  email: string;
  username: string;
  language: string;
  timezone: string;
  role: string;
  status: "Active" | "Inactive";
};

type Role = {
  id: number;
  roleName: string;
  description: string;
  modulePermissions: string[];
  actionPermissions: string[];
  status: "Active" | "Inactive";
};

// ===== Sample Data =====

const sampleUsers: User[] = [
  {
    id: 1,
    firstName: "John",
    middleName: "A",
    lastName: "Doe",
    gender: "Male",
    phone: "9876543210",
    dob: "1990-05-15",
    email: "john.doe@company.com",
    username: "johndoe",
    language: "English",
    timezone: "Asia/Kolkata",
    role: "Admin",
    status: "Active",
  },
  {
    id: 2,
    firstName: "Sarah",
    middleName: "M",
    lastName: "Smith",
    gender: "Female",
    phone: "9876543211",
    dob: "1988-08-22",
    email: "sarah.smith@company.com",
    username: "sarahsmith",
    language: "English",
    timezone: "Asia/Kolkata",
    role: "Sales Manager",
    status: "Active",
  },
  {
    id: 3,
    firstName: "Raj",
    middleName: "",
    lastName: "Kumar",
    gender: "Male",
    phone: "9876543212",
    dob: "1992-03-10",
    email: "raj.kumar@company.com",
    username: "rajkumar",
    language: "Hindi",
    timezone: "Asia/Kolkata",
    role: "HR Manager",
    status: "Inactive",
  },
];

const sampleRoles: Role[] = [
  {
    id: 1,
    roleName: "Admin",
    description: "Full system access with all permissions",
    modulePermissions: ["Inventory", "Sales", "Purchase", "Accounting", "HR"],
    actionPermissions: ["Create", "Edit", "Delete", "View", "Export"],
    status: "Active",
  },
  {
    id: 2,
    roleName: "Sales Manager",
    description: "Manage sales operations and customer relations",
    modulePermissions: ["Sales", "Inventory"],
    actionPermissions: ["Create", "Edit", "View", "Export"],
    status: "Active",
  },
  {
    id: 3,
    roleName: "HR Manager",
    description: "Manage human resources and employee data",
    modulePermissions: ["HR"],
    actionPermissions: ["Create", "Edit", "View"],
    status: "Active",
  },
  {
    id: 4,
    roleName: "Accountant",
    description: "Manage financial records and accounting",
    modulePermissions: ["Accounting", "Reports"],
    actionPermissions: ["View", "Edit", "Export"],
    status: "Active",
  },
];

// ===== Module Meta =====
const userManagementModule = {
  name: "User Management",
  icon: <FaUsers />,
  defaultTab: "users",
  tabs: [
    { id: "users", name: "User Management", icon: <FaUserCog /> },
    { id: "roles", name: "Role Management", icon: <FaUserShield /> },
  ],
};

const UserModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState(userManagementModule.defaultTab);
  const [users, setUsers] = useState<User[]>(sampleUsers);
  const [roles, setRoles] = useState<Role[]>(sampleRoles);

  const handleUserSubmit = (
    data: Omit<User, "id">,
    isEdit: boolean,
    userId?: number,
  ) => {
    if (isEdit && userId !== undefined) {
      setUsers(
        users.map((u) => (u.id === userId ? { ...data, id: userId } : u)),
      );
    } else {
      setUsers([...users, { ...data, id: Date.now() }]);
    }
  };

  const handleUserDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      setUsers(users.filter((u) => u.id !== id));
    }
  };

  const handleRoleSubmit = (
    data: Omit<Role, "id">,
    isEdit: boolean,
    roleId?: number,
  ) => {
    if (isEdit && roleId !== undefined) {
      setRoles(
        roles.map((r) => (r.id === roleId ? { ...data, id: roleId } : r)),
      );
    } else {
      setRoles([...roles, { ...data, id: Date.now() }]);
    }
  };

  const handleRoleDelete = (id: number) => {
    const roleToDelete = roles.find((r) => r.id === id);
    const usersWithRole = users.filter(
      (u) => u.role === roleToDelete?.roleName,
    );
    if (usersWithRole.length > 0) {
      alert(
        `Cannot delete this role! ${usersWithRole.length} user(s) are assigned to "${roleToDelete?.roleName}" role. Please reassign users first.`,
      );
      return;
    }
    if (window.confirm("Are you sure you want to delete this role?")) {
      setRoles(roles.filter((r) => r.id !== id));
    }
  };

  return (
    <div className="p-6 bg-app min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-main">
          <span>{userManagementModule.icon}</span> {userManagementModule.name}
        </h2>
        <div className="flex items-center gap-4 px-4 py-2 rounded-lg shadow-sm bg-card border border-theme">
          <div className="text-sm">
            <span className="font-semibold text-main">{users.length}</span>
            <span className="text-muted ml-1">Users</span>
          </div>
          <div
            className="w-px h-6"
            style={{ background: "var(--border)" }}
          ></div>
          <div className="text-sm">
            <span className="font-semibold text-main">{roles.length}</span>
            <span className="text-muted ml-1">Roles</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        {userManagementModule.tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium flex items-center gap-2 transition-colors ${
              activeTab === tab.id
                ? "text-primary border-b-2 border-current"
                : "text-muted hover:text-main"
            }`}
          >
            <span>{tab.icon}</span> {tab.name}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="">
        {activeTab === "users" && (
          <UserCreation
            users={users}
            roles={roles}
            onSubmit={handleUserSubmit}
            onDelete={handleUserDelete}
          />
        )}
        {activeTab === "roles" && (
          <UserRole
            roles={roles}
            onSubmit={handleRoleSubmit}
            onDelete={handleRoleDelete}
          />
        )}
      </div>
    </div>
  );
};

export default UserModule;
