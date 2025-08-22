import { FaHome, FaUserShield, FaUsers } from "react-icons/fa";

export default function RoleSelector({ selected, setSelected }) {
  const roles = [
    { name: "Resident", icon: <FaHome size={20} /> },
    { name: "Security Personnel", icon: <FaUserShield size={20} /> },
    { name: "Community Official", icon: <FaUsers size={20} /> },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {roles.map((role) => (
        <button
          key={role.name}
          onClick={() => setSelected(role.name)}
          className={`flex flex-col items-center justify-center border rounded-md p-4 text-xs transition duration-200
            ${
              selected === role.name
                ? "bg-green-100 border-green-500 text-green-700 font-semibold"
                : "bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200"
            }`}
        >
          {role.icon}
          <span className="mt-1 text-center">{role.name}</span>
        </button>
      ))}
    </div>
  );
}
