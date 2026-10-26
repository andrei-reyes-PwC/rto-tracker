import InlineNotification from "@/components/InlineNotification";

export default function CrudActionNotice({ message, onDismiss }: {
  message: string;
  onDismiss: () => void;
}) {
  return <InlineNotification message={message} tone="success" onDismiss={onDismiss} />;
}
