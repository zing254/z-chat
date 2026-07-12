const CONTACTS = [
  { id: 'contact_1', username: 'Ghost Protocol', publicKey: 'H/MFeH4zXbBwCKlA7xRnCKx2KuM8OsMdx3DiHTXU9hM=', status: 'online' },
  { id: 'contact_2', username: 'Neon Rider', publicKey: 'He+DXxzcBsX0x9wTS3/mzKGHv6SfZYc5VIAqm+QFNHc=', status: 'offline' },
  { id: 'contact_3', username: 'Cipher_Mist', publicKey: 'x2lQeSv7T4Rz2xokMBir7m5M99wg5Rb0c+8au0IJc3A=', status: 'typing' },
  { id: 'contact_4', username: 'Shadow_Net', publicKey: 'OzuaiciQDtGu77hiKO3owhDhGtBiWhaMJVWPwfya4mM=', status: 'online' },
  { id: 'contact_5', username: 'VoidWalker', publicKey: 'kyU1HDN53WlYhjHG8XXygjDVE6V4o85KUiIxIhKqcg4=', status: 'offline' },
];

export function getContact(id) {
  return CONTACTS.find(c => c.id === id) || { id, username: 'Unknown', publicKey: '', status: 'offline' };
}

export function searchContacts(query) {
  const q = query.toLowerCase();
  return CONTACTS.filter(c => c.username.toLowerCase().includes(q));
}

export function getAllContacts() {
  return [...CONTACTS];
}
