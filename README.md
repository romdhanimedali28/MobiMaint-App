# WebRTC Video Calling App

This is a **React Native** project for a professional video calling application that connects Technicians with Experts for remote assistance and work order support.

## 🏗️ Architecture Overview

### Backend Infrastructure
- **WebRTC Server**: Deployed on Azure Cloud
- **DNS**: `http://webrtc-medali.japaneast.cloudapp.azure.com`
- **TURN/STUN Server**: For NAT traversal and peer connection establishment
- **Socket.io**: Real-time signaling for WebRTC negotiation

### App Navigation Flow
```
Backend Setup → Login → Role-Based Dashboard
                 ├── Technician → Work Orders → Expert List → Video Call
                 └── Expert → Dashboard → Wait for Calls → Video Call
```

## 👥 User Roles & Workflows

### 🔧 Technician Workflow
1. **Login** → Access technician dashboard
2. **Work Orders** → View assigned work orders and details
3. **Expert List** → Browse available online experts
4. **Video Call** → Connect with selected expert for assistance

### 🎓 Expert Workflow  
1. **Login** → Access expert dashboard
2. **Dashboard** → Wait for incoming call requests from technicians
3. **Accept Calls** → Receive and respond to video call requests
4. **Video Support** → Provide remote assistance via video call

## 🎥 WebRTC Video Calling Process

### Initialization Phase
1. **Permission Request**: Camera and microphone access
2. **TURN Server Test**: Connectivity check for NAT traversal
3. **Local Stream Setup**: Initialize user's camera and microphone
4. **Socket Connection**: Connect to signaling server

### Call Establishment (Technician Initiates)
```
sequenceDiagram
    Technician->>Server: Create call request
    Server->>Expert: Incoming call notification
    Expert->>Server: Accept/Decline response
    Server->>Technician: Call acceptance confirmation
    Technician->>Expert: SDP Offer (via server)
    Expert->>Technician: SDP Answer (via server)
    Technician<-->Expert: ICE candidates (via server)
```

### Connection States
1. **Initializing**: Setting up WebRTC components
2. **Connecting**: Establishing peer connection
3. **Connected**: Active video call with media streams
4. **Failed**: Connection timeout or error state

## 🎛️ Video Call Features

### Media Controls
- **🎤 Microphone**: Toggle audio on/off
- **📹 Camera**: Enable/disable local video
- **🔄 Camera Flip**: Switch between front/rear camera  
- **📞 End Call**: Terminate the video session

### Stream Management
- **Local Video**: Small overlay showing user's camera (120x160px)
- **Remote Video**: Full screen view of the other participant
- **Media Quality**: Automatic adaptation based on network conditions

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- React Native development environment
- Android Studio / Xcode
- Physical device (recommended for camera/microphone testing)

### Installation

1. **Clone and Install Dependencies**
```bash
git clone https://github.com/romdhanimedali28/MobiMaint-App.git
cd webrtc-video-app
npm install

# For iOS only
cd ios && bundle install && bundle exec pod install && cd ..
```

2. **Start Development Server**
```bash
# Start Metro bundler
npm start

# In separate terminals:
npm run android  # For Android
npm run ios      # For iOS
```

### Configuration

1. **Backend Setup Screen**: Configure your WebRTC server URL
2. **Permissions**: Grant camera and microphone permissions when prompted
3. **Network**: Ensure stable internet connection for video calling

## 📱 Screen Structure

```
AppNavigator/
├── BackendScreen      # Server configuration
├── LoginScreen        # User authentication  
├── MainPageScreen     # Role selection/dashboard
├── HomeScreen         # Technician home
├── WorkOrderDetails   # Work order information
├── ExpertListScreen   # Available experts
├── ExpertHomeScreen   # Expert dashboard
├── VideoCallScreen    # Video calling interface
├── ProfileScreen      # User profile
└── AIScreen          # AI assistance features
```

## 🔧 Technical Implementation

### WebRTC Components
- **MediaStream**: Camera and microphone access
- **RTCPeerConnection**: Peer-to-peer connection management
- **RTCView**: Video stream rendering components
- **Socket.io**: Real-time signaling for connection negotiation

### Key Technologies
- React Native WebRTC
- Socket.io Client
- React Navigation 6
- AsyncStorage for configuration
- Native permissions handling

### Error Handling
- Connection timeout management (45 seconds)
- Automatic reconnection attempts
- Graceful degradation for network issues
- User-friendly error messages

## 🌐 Network Requirements

### Firewall Configuration
- **STUN**: Port 3478 (UDP/TCP)
- **TURN**: Port 3478 (UDP/TCP) 
- **HTTPS**: Port 443 for signaling
- **ICE**: Dynamic port range for media

### Supported Networks
- WiFi networks
- 4G/5G cellular networks
- Corporate networks (with proper firewall configuration)

## 🔒 Security Features

- Encrypted peer-to-peer communication
- TURN server authentication
- User role-based access control
- Secure signaling over HTTPS/WSS

## 📚 Development Notes

### Production Build
- All debug logs and development tools removed
- Optimized for performance and battery usage
- Professional UI with proper icons and animations
- Error handling without debug information exposure

### Testing Recommendations
- Test on real devices rather than simulators
- Verify camera/microphone permissions
- Test on different network conditions
- Validate TURN server connectivity

## 🐛 Troubleshooting

### Common Issues
1. **Camera/Mic Access**: Ensure permissions are granted in device settings
2. **Connection Fails**: Check network connectivity and firewall settings
3. **No Remote Video**: Verify TURN server accessibility
4. **App Crashes**: Check device compatibility and available memory

### Support
For technical issues or deployment questions, ensure your Azure WebRTC server is properly configured and accessible from client devices.

---

## 🏁 Quick Start Commands

```bash
# Development
npm start
npm run android  # or ios

# Clean build (if experiencing issues)
npm run android -- --reset-cache
cd ios && rm -rf build && cd .. && npm run ios
```

This app provides a complete solution for remote technical support through professional-grade video calling, enabling seamless communication between field technicians and expert support staff.
