import express from 'express';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contactsFile = path.join(__dirname, '../data/contacts.json');

// Get all contacts
router.get('/contacts', (req, res) => {
  fs.readFile(contactsFile, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read contacts' });
    const contacts = JSON.parse(data).contacts || [];
    res.json(contacts);
  });
});

// Add a new contact with a unique id
router.post('/contacts', (req, res) => {
  const newContact = { ...req.body, id: randomUUID() };
  fs.readFile(contactsFile, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read contacts' });
    const json = JSON.parse(data);
    json.contacts.push(newContact);
    fs.writeFile(contactsFile, JSON.stringify(json, null, 2), err => {
      if (err) return res.status(500).json({ error: 'Failed to save contact' });
      res.status(201).json(newContact);
    });
  });
});

// Delete a contact by id
router.delete('/contacts/:id', (req, res) => {
  const contactId = req.params.id;
  fs.readFile(contactsFile, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read contacts' });
    let json = JSON.parse(data);
    const originalLength = json.contacts.length;
    json.contacts = json.contacts.filter(contact => contact.id !== contactId);
    if (json.contacts.length === originalLength) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    fs.writeFile(contactsFile, JSON.stringify(json, null, 2), err => {
      if (err) return res.status(500).json({ error: 'Failed to delete contact' });
      res.status(204).send();
    });
  });
});

export default router;