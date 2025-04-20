import { Messages } from "./_components/Message";

export default function Page() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Chat</h1>
      <p className="text-gray-500">
        This is a chat page. You can use it to chat with other users.
      </p>
      <Messages/>
    </div>
  );
}