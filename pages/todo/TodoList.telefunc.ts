// We use Telefunc (https://telefunc.com) for data mutations.

export async function onNewTodo({ text }: { text: string }) {
  // NOTE: This telefunction is only for demonstration — it doesn't actually save changes to a database.
  // Go to https://vike.dev/new and select a database to scaffold an app with a persisted to-do list.
  console.log(`Received ${text}`);
}
