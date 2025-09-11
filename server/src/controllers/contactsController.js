const fs = require('fs').promises;
const path = require('path');

const CONTACTS_FILE = path.join(__dirname, '../data/contacts.json');

const contactsController = {
  async getContacts(req, res) {
    try {
      const data = await fs.readFile(CONTACTS_FILE, 'utf8');
      const { contacts } = JSON.parse(data);
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ error: 'Failed to load contacts' });
    }
  },

  async addContact(req, res) {
    try {
      const data = await fs.readFile(CONTACTS_FILE, 'utf8');
      const { contacts } = JSON.parse(data);
      
      const newContact = {
        id: Date.now().toString(),
        ...req.body
      };
      
      contacts.push(newContact);
      
      await fs.writeFile(CONTACTS_FILE, JSON.stringify({ contacts }, null, 2));
      res.status(201).json(newContact);
    } catch (error) {
      res.status(500).json({ error: 'Failed to add contact' });
    }
  },

  async deleteContact(req, res) {
    try {
      const data = await fs.readFile(CONTACTS_FILE, 'utf8');
      let { contacts } = JSON.parse(data);
      
      contacts = contacts.filter(contact => contact.id !== req.params.id);
      
      await fs.writeFile(CONTACTS_FILE, JSON.stringify({ contacts }, null, 2));
      res.status(200).json({ message: 'Contact deleted' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete contact' });
    }
  }
};

module.exports = contactsController;