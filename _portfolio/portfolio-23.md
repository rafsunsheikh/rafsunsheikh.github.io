---
title: "Legal PDF to LLM Instruction Dataset Pipeline"
excerpt: "Synthetic training data for LLMs"
collection: portfolio
date: 2025-11-01
---

**Timeline:** November 2025

- **Project Description:** Turns legal regulations into training data for language models. It extracts the text from regulation PDFs, splits it into overlapping chunks, and asks a local Ollama model (llama3.1:8b by default) to write one grounded question and answer pair for each chunk. The output is a JSONL instruction dataset ready for fine-tuning. A FastAPI web page shows live progress. Built with Python, pypdf, LangChain text splitters, Ollama and FastAPI.

- **Project Github Link:** [regulatory_legal_dataset_generation](https://github.com/rafsunsheikh/regulatory_legal_dataset_generation)
