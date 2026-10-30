---
title: "Stop Vote Rigging: IPFS and Blockchain Election Results Server"
excerpt: "Election integrity backend"
collection: portfolio
date: 2026-02-01
---

**Timeline:** February 2026 - March 2026

- **Project Description:** The backend for the Stop Vote Rigging project, which makes it harder to change election results after they leave the polling station. The result sheet from each booth is stored on IPFS, the polling agents for that booth must sign it off, and the final record is written to an Ethereum smart contract where anyone can check it. The server handles IPFS uploads through Pinata, role-based logins with Supabase, the multi-signature approval flow, and reading the on-chain records back. Built with Node.js, Express, Supabase, Pinata and ethers.js.

- **Project Github Link:** [ipfs_pin_server](https://github.com/rafsunsheikh/ipfs_pin_server)
