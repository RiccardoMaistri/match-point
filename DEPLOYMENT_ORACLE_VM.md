# Deployment Guide: Oracle Cloud VM with Docker & PostgreSQL

This guide provides step-by-step instructions for deploying the full-stack `match-point` application to an Oracle Cloud Virtual Machine (or any other cloud VM) using Docker.

This approach is more robust and scalable than the free-tier PaaS deployment, giving you full control over your environment.

## Deployment Strategy

We will use Docker and Docker Compose to orchestrate four containerized services:

1.  **PostgreSQL (`db`):** A dedicated container for our database.
2.  **FastAPI Backend (`backend`):** The Python backend service, connected to the database.
3.  **React Frontend (`frontend`):** A lightweight Nginx server that serves the static, built React application.
4.  **Nginx Proxy (`nginx`):** The main entry point. It receives all traffic and acts as a reverse proxy, directing requests to the appropriate service:
    -   Requests to `/api/*` are routed to the **backend**.
    -   All other requests are routed to the **frontend**.



## Prerequisites

- An Oracle Cloud account (the free tier is sufficient).
- Your code pushed to a GitHub repository.
- An SSH key pair to connect to your VM.

---

## Step 1: Set Up the Oracle Cloud VM

1.  **Launch a VM Instance:**
    - In your Oracle Cloud dashboard, navigate to **Compute** -> **Instances**.
    - Click **Create instance**.
    - **Image:** Select **Canonical Ubuntu**.
    - **Shape:** Choose an "Always Free-eligible" shape (e.g., `VM.Standard.A1.Flex`).
    - **Networking:** Ensure "Assign a public IPv4 address" is selected.
    - **Add SSH Keys:** Paste your public SSH key.
    - Click **Create**.

2.  **Configure Network Security:**
    - Go to your instance's details page, click the **Virtual Cloud Network**.
    - Navigate to **Security Lists** and select the default list for your VCN.
    - Add **Ingress Rules** to allow web traffic:
      - **Source CIDR:** `0.0.0.0/0`
      - **IP Protocol:** `TCP`
      - **Destination Port Range:** `80` (for HTTP)
      - **Destination Port Range:** `443` (for HTTPS, if you add it later)

3.  **Connect to your VM:**
    - Find the **Public IP address** of your instance.
    - Connect via SSH (the default username for Ubuntu is `ubuntu`):
      ```bash
      ssh ubuntu@<YOUR_PUBLIC_IP>
      ```

## Step 2: Prepare the Server

1.  **Install Docker and Git:**
    Run the following commands on your VM to install the necessary software.
    ```bash
    # Update package lists and upgrade existing packages
    sudo apt-get update && sudo apt-get upgrade -y

    # Install Git, Docker, and Docker Compose
    sudo apt-get install -y git docker.io docker-compose

    # Add your user to the 'docker' group to run commands without sudo
    sudo usermod -aG docker ${USER}
    ```

2.  **Log out and log back in** for the group changes to take effect.
    ```bash
    exit
    ```
    Then, reconnect with SSH. You can verify the Docker installation with `docker --version`.

## Step 3: Deploy the Application

1.  **Clone Your Repository:**
    On your VM, clone the project code from your GitHub repository.
    ```bash
    git clone https://github.com/YOUR_USERNAME/match-point.git
    cd match-point
    ```

2.  **Create Environment File:**
    This file will hold your secrets. It is listed in `.gitignore` and will not be committed to your repository.
    Create a `.env` file in the project root:
    ```bash
    nano .env
    ```
    Add the following content. **Choose a strong, unique password.**
    ```ini
    # PostgreSQL Credentials
    POSTGRES_DB=matchpoint
    POSTGRES_USER=postgres
    POSTGRES_PASSWORD=YourSuperSecretAndStrongPassword

    # Backend Configuration
    # The DATABASE_URL uses the service names and credentials from above
    DATABASE_URL=postgresql://postgres:YourSuperSecretAndStrongPassword@db:5432/matchpoint
    FRONTEND_BASE_URL=http://<YOUR_PUBLIC_IP> # Replace with your VM's IP or domain

    # Frontend Configuration
    # The API is accessed via the Nginx proxy, so a relative path is used
    REACT_APP_API_URL=/api
    ```
    Save the file (in `nano`, press `Ctrl+X`, then `Y`, then `Enter`).

3.  **Configure Nginx Proxy:**
    Edit the Nginx proxy configuration to use your VM's IP address or domain name.
    ```bash
    nano nginx.proxy.conf
    ```
    Find the `server_name` line and replace the placeholder with your public IP.
    ```nginx
    # Change this line
    server_name your_vm_ip; # Replace with your actual IP
    ```

4.  **Build and Run with Docker Compose:**
    This single command will build the Docker images for your frontend and backend, download the PostgreSQL image, and start all the containers in the correct order.
    ```bash
    docker-compose up --build -d
    ```
    - `--build`: Forces a rebuild of your application images.
    - `-d`: Runs the containers in detached mode (in the background).

## Step 4: Verify the Deployment

1.  **Check Container Status:**
    ```bash
    docker-compose ps
    ```
    You should see four containers (`db`, `backend`, `frontend`, `nginx`) with a state of `Up`.

2.  **Check Logs (if needed):**
    If a container is not running correctly, you can view its logs to debug the issue.
    ```bash
    docker-compose logs -f backend
    docker-compose logs -f nginx
    ```

3.  **Access Your Application:**
    Open your web browser and navigate to your VM's public IP address: `http://<YOUR_PUBLIC_IP>`. You should see your React application!

---

## Next Steps

- **Secure with HTTPS:** Use Let's Encrypt and Certbot to add a free SSL certificate. You can integrate Certbot directly into the `nginx` proxy service.
- **Set Up a Domain Name:** Point a custom domain to your VM's IP address for a professional URL.
- **Automate Deployments (CI/CD):** Create a GitHub Action to automatically connect to your server via SSH, pull the latest code, and restart the Docker containers whenever you push to your `main` branch.