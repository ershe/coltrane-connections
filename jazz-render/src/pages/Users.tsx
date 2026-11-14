import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";

export default function Users() {
  const [users, setUsers] = useState<{ id: number; name: string }[]>([]);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    fetch("http://localhost:3000/api/users")
      .then((res) => res.json())
      .then((data) => setUsers(data));
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const res = await fetch("http://localhost:3000/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: newName }),
    });

    const newUser = await res.json();
    setUsers([...users, newUser]);
    setNewName("");
  };

  return (
    <div className="p-4 dark:bg-gray-800 dark:text-white min-h-screen grow flex flex-col gap-8">
      <section id="next-steps">
        <div>
          <h1 className="text-2xl font-bold mb-4">Users from SQLite</h1>
          <div className="flex flex-col gap-2">
            {users.map((user) => (
              <div
                className="p-2 bg-gray-200 dark:bg-gray-700 rounded"
                key={user.id}>
                {user.name}
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="spacer"></section>
      <section>
        <form onSubmit={handleAddUser}>
          <FieldGroup>
            <FieldSet>
              <FieldLegend>Submit User</FieldLegend>
              <FieldDescription>
                This form allows you to submit a new user to the SQLite
                database. Enter a name and click "Add User" to see it appear in
                the list above.
              </FieldDescription>
            </FieldSet>
            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter new user name"
              />
            </Field>
            <FieldSet>
              <Button type="submit">Add User</Button>
            </FieldSet>
          </FieldGroup>
        </form>
      </section>
    </div>
  );
}
