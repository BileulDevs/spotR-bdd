# SpotR-BDD  
Microservice de gestion de la base de données pour SpotR  

## 📌 Description  
**SpotR-BDD** est le microservice responsable de la gestion et de l’accès aux données du "réseau social" **SpotR**, dédié au carspotting.  
Il centralise la lecture et l’écriture des données, assure leur intégrité et fournit une API d’accès aux autres microservices.  

Les principaux objectifs :  
- Stocker et organiser les données utilisateurs, publications et interactions.  
- Garantir la cohérence et l’intégrité des informations. 
- Gérer les index et optimisations pour de meilleures performances.  
- Gestion de la base de données.

---

## ⚙️ Fonctionnalités  
- 🗄 **Stockage des données** : utilisateurs, publications, abonnements, etc.  
- 🔍 **Requêtes optimisées** : filtres, recherches et pagination.  
- 🛡 **Validation et intégrité** : règles de cohérence applicatives.  
- 🔄 **Synchronisation** : échanges de données fiables avec les autres microservices.  
- 📡 **API REST** : endpoints sécurisés pour la gestion des données.  

---

## 🛠️ Stack technique  
- **Langage** : JavaScript  
- **Framework API** : Express.js  
- **Base de données** : MongoDB  
- **ORM / ODM** : Mongoose  

---

## 🚀 Changelog  

### 1. Version 1 (v1.0.0)
- Base de données  
- Création des schémas et modèles principaux  
- Tâches cron. 
