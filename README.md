
# **BBNS Portal** — Blockchain-Based Negotiation System
> **Secure • Transparent • Decentralized Decision-Making**

![BBNS Banner](https://dummyimage.com/1200x400/1c1c1c/ffffff&text=Blockchain-Based+Negotiation+System)

## **Overview**
The **BBNS Portal** is a **Blockchain-Based Negotiation System** that provides a **secure, transparent, and decentralized platform** for **requirement analysis**, **multi-criteria decision-making**, and **collaborative negotiations**.  
It leverages **blockchain**, **smart contracts**, and **multi-party evaluation frameworks** to ensure **immutability, trust, and auditability**.

---

## **Key Features**
- 🔐 **Decentralized Security** — Every negotiation is secured using blockchain immutability.
- 📊 **Multi-Criteria Decision-Making (MCDM)** — Integrates algorithms like **TOPSIS**, **WSM**, and **AHP** for fair, data-driven decisions.
- 📜 **Smart Contracts** — Automate proposal acceptance, agreement finalization, and dispute resolution.
- 🏛 **Regulator-Friendly Logs** — Transparent negotiation records for compliance and auditing.
- 👥 **Role-Based Access Control** — Stakeholders, admins, and regulators each have secure, controlled permissions.
- 📈 **Evaluation Metrics** — Supports KPIs like **TTC**, **NRC**, **Utility Gain**, and **Success Rate**.

---

## **Technology Stack**
| Layer          | Technology Used |
|---------------|------------------|
| **Frontend**  | React + TypeScript + Vite |
| **Backend**   | Node.js + NestJS |
| **Blockchain**| Ethereum / Hyperledger Fabric |
| **Database**  | PostgreSQL + Prisma ORM |
| **Auth**      | JWT + Role-Based Access Control |
| **UI Library**| TailwindCSS + ShadCN UI |
| **Versioning**| Git + GitHub |

---

## **System Architecture**

```mermaid
flowchart LR
    User -->|Proposals / Inputs| UI[Frontend Portal]
    UI --> API[Backend API]
    API --> BC[Blockchain Network]
    API --> DB[(PostgreSQL DB)]
    BC --> Logs[Immutable Negotiation Logs]
    Admin -->|Approve/Manage| API
    Regulator -->|Audit| Logs
```

---

## **Project Structure**

```
bbns-portal/
├── src/
│   ├── assets/                 # Static assets (images, icons, etc.)
│   ├── components/             # Reusable components
│   ├── layouts/                # Admin & User layouts
│   ├── pages/
│   │   ├── Admin/              # Admin dashboards & evaluation tools
│   │   ├── Auth/               # Login, registration, password recovery
│   │   ├── User/               # Proposal submission & tracking
│   ├── services/               # API integration & blockchain handlers
│   ├── hooks/                  # Custom React hooks
│   ├── utils/                  # Helpers and constants
│   └── styles/                 # Tailwind + global styles
├── public/                     # Public static files
├── README.md                   # Project documentation
├── package.json                # Dependencies & scripts
├── vite.config.ts              # Vite config
└── tsconfig.json               # TypeScript config
```

---

## **Installation & Setup**

### **1. Clone the Repository**
```bash
git clone https://github.com/DamiAIExpert/bbns-portal.git
cd bbns-portal
```

### **2. Install Dependencies**
```bash
npm install
```

### **3. Configure Environment**
Create a `.env` file in the project root:

```env
VITE_APP_NAME=BBNS Portal
VITE_API_URL=https://blockchain-negotiation-api-9wsj.onrender.com
VITE_BLOCKCHAIN_NETWORK=sepolia
JWT_SECRET=your-secret-key
DATABASE_URL=postgresql://user:password@localhost:5432/bbns
```

### **4. Run Development Server**
```bash
npm run dev
```

---

## **Available Scripts**

| Command          | Description                         |
|------------------|-------------------------------------|
| `npm run dev`    | Start development server            |
| `npm run build`  | Build optimized production version  |
| `npm run lint`   | Run ESLint for code quality checks  |
| `npm run preview`| Preview production build locally    |

---

## **Evaluation Metrics**
The portal integrates **AI-assisted analytics** to evaluate negotiation outcomes:

| Metric          | Meaning                                    |
|-----------------|------------------------------------------|
| **TTC**        | Time-To-Consensus between parties         |
| **NRC**        | Negotiation Round Count                  |
| **Utility Gain** | Average benefit across stakeholders     |
| **Success Rate** | Ratio of successful negotiations        |

---

## **Future Enhancements**
- ✅ Integration with **AI-driven negotiation assistants**
- ✅ Support for **multi-chain negotiation storage**
- ✅ Advanced **data visualization dashboards**
- ✅ Real-time collaboration for stakeholders

---

## **Contributing**
We welcome contributions!  
Fork the repository and submit a **pull request** or open an **issue** to suggest enhancements.

---

## **License**
This project is licensed under the **MIT License**.  
See the [LICENSE](LICENSE) file for details.
