// clujUniversityMapsService.js
import { API_CONFIG } from "./config.js";
// Location data and maps services for Technical University of Cluj-Napoca
// Mock coordinates for Technical University of Cluj-Napoca buildings
const locationMap = {
    // Main Campus Buildings
    'Building A, Floor 2': { 
        lat: 46.7712, 
        lng: 23.6236, 
        address: 'Clădirea A, Str. Constantin Daicoviciu nr. 15, Cluj-Napoca, România',
        buildingCode: 'MAIN'
    },
    'Building B, Floor 1': { 
        lat: 46.7698, 
        lng: 23.6189, 
        address: 'Clădirea B, Str. Memorandumului nr. 28, Cluj-Napoca, România',
        buildingCode: 'AC' 
    },
    'Building C, Floor 3': { 
        lat: 46.7734, 
        lng: 23.6267, 
        address: 'Clădirea C, Str. George Barițiu nr. 25, Cluj-Napoca, România',
        buildingCode: 'IE'
    },
    'Building D, Floor 4': { 
        lat: 46.7756, 
        lng: 23.6298, 
        address: 'Clădirea D, Str. Observatorului nr. 34, Cluj-Napoca, România',
        buildingCode: 'RES'
    },
    // Faculty-Specific Buildings
    'Facultatea de Automatică și Calculatoare': { 
        lat: 46.7706, 
        lng: 23.6234, 
        address: 'Facultatea de Automatică și Calculatoare, Str. Memorandumului nr. 28, Cluj-Napoca, România',
        buildingCode: 'AC' 
    },
    'Facultatea de Inginerie Electrică': { 
        lat: 46.7718, 
        lng: 23.6198, 
        address: 'Facultatea de Inginerie Electrică, Str. Croitorilor nr. 2, Cluj-Napoca, România',
        buildingCode: 'IE' 
    },
    'Facultatea de Construcții': { 
        lat: 46.7694, 
        lng: 23.6213, 
        address: 'Facultatea de Construcții, Str. Constantin Daicoviciu nr. 15, Cluj-Napoca, România',
        buildingCode: 'FC'
    },
    'Facultatea de Mecanică': { 
        lat: 46.7742, 
        lng: 23.6289, 
        address: 'Facultatea de Mecanică, Bd. Muncii nr. 103-105, Cluj-Napoca, România',
        buildingCode: 'FM'
    },
    'Centrul de Cercetare și Inovare': { 
        lat: 46.7723, 
        lng: 23.6201, 
        address: 'Centrul de Cercetare și Inovare, Str. Republicii nr. 37, Cluj-Napoca, România',
        buildingCode: 'RES'
    },
    'Biblioteca Centrală Universitară': { 
        lat: 46.7678, 
        lng: 23.6145, 
        address: 'Biblioteca Centrală Universitară, Str. Clinicilor nr. 2, Cluj-Napoca, România',
        buildingCode: 'LIB'
    },
    // Engineering & Technology Buildings
    'Tech Building, Floor 1': { 
        lat: 46.7689, 
        lng: 23.6156, 
        address: 'Centrul de Tehnologie, Str. Donath nr. 103-105, Cluj-Napoca, România',
        buildingCode: 'RES' 
    },
    'Tech Building, Floor 2': { 
        lat: 46.7689, 
        lng: 23.6156, 
        address: 'Centrul de Tehnologie, Str. Donath nr. 103-105, Cluj-Napoca, România',
        buildingCode: 'RES' 
    },
    // Computer Labs and Study Spaces
    'Lab 1 - Programming': { 
        lat: 46.7706, 
        lng: 23.6234, 
        address: 'Laboratorul de Programare, Str. Memorandumului nr. 28, Cluj-Napoca, România',
        buildingCode: 'AC'
    },
    'Lab 2 - Design': { 
        lat: 46.7689, 
        lng: 23.6156, 
        address: 'Laboratorul de Design, Str. Donath nr. 103-105, Cluj-Napoca, România',
        buildingCode: 'RES'
    },
    'Lab 3 - Data Science': { 
        lat: 46.7706, 
        lng: 23.6234, 
        address: 'Laboratorul de Data Science, Str. Memorandumului nr. 28, Cluj-Napoca, România',
        buildingCode: 'AC'
    },
    'Lab 4 - Networking': { 
        lat: 46.7718, 
        lng: 23.6198, 
        address: 'Laboratorul de Rețele, Str. Croitorilor nr. 2, Cluj-Napoca, România',
        buildingCode: 'IE'
    },
    'Lab 5 - AI/ML Research': { 
        lat: 46.7723, 
        lng: 23.6201, 
        address: 'Laboratorul AI/ML, Str. Republicii nr. 37, Cluj-Napoca, România',
        buildingCode: 'RES' 
    },
    // Study Rooms
    'Room A-201': { 
        lat: 46.7712, 
        lng: 23.6236, 
        address: 'Sala A-201, Str. Constantin Daicoviciu nr. 15, Cluj-Napoca, România',
        buildingCode: 'MAIN'
    },
    'Room A-202': { 
        lat: 46.7712, 
        lng: 23.6236, 
        address: 'Sala A-202, Str. Constantin Daicoviciu nr. 15, Cluj-Napoca, România',
        buildingCode: 'MAIN' 
    },
    'Room B-101': { 
        lat: 46.7698, 
        lng: 23.6189, 
        address: 'Sala B-101, Str. Memorandumului nr. 28, Cluj-Napoca, România',
        buildingCode: 'AC'
    },
    'Room B-102': { 
        lat: 46.7698, 
        lng: 23.6189, 
        address: 'Sala B-102, Str. Memorandumului nr. 28, Cluj-Napoca, România',
        buildingCode: 'AC'
    },
    'Room C-301': { 
        lat: 46.7734, 
        lng: 23.6267, 
        address: 'Sala C-301, Str. George Barițiu nr. 25, Cluj-Napoca, România',
        buildingCode: 'IE'
    },
    'Conference Room D-401': { 
        lat: 46.7756, 
        lng: 23.6298, 
        address: 'Sala de Conferințe D-401, Str. Observatorului nr. 34, Cluj-Napoca, România',
        buildingCode: 'RES' 
    },
    // Specialized Buildings
    'Research Building, Floor 1': { 
        lat: 46.7723, 
        lng: 23.6201, 
        address: 'Centrul de Cercetare, Str. Republicii nr. 37, Cluj-Napoca, România',
        buildingCode: 'RES'
    },
    'Media Center': { 
        lat: 46.7701, 
        lng: 23.6178, 
        address: 'Centrul Media, Str. Emil Isac nr. 15, Cluj-Napoca, România',
        buildingCode: 'MEDIA'
    },
    'Innovation Lab': { 
        lat: 46.7723, 
        lng: 23.6201, 
        address: 'Laboratorul de Inovație, Str. Republicii nr. 37, Cluj-Napoca, România',
        buildingCode: 'RES'
    },
    // Equipment and Lab Rooms
    'Equipment Room A': { 
        lat: 46.7712, 
        lng: 23.6236, 
        address: 'Sala Echipamente A, Str. Constantin Daicoviciu nr. 15, Cluj-Napoca, România',
        buildingCode: 'MAIN' 
    },
    'Equipment Room B': { 
        lat: 46.7698, 
        lng: 23.6189, 
        address: 'Sala Echipamente B, Str. Memorandumului nr. 28, Cluj-Napoca, România',
        buildingCode: 'AC' 
    },
    'Equipment Room C': { 
        lat: 46.7734, 
        lng: 23.6267, 
        address: 'Sala Echipamente C, Str. George Barițiu nr. 25, Cluj-Napoca, România',
        buildingCode: 'IE' 
    },
    // Library and Digital Resources
    'Digital Library Access': { 
        lat: 46.7678, 
        lng: 23.6145, 
        address: 'Biblioteca Centrală Universitară, Str. Clinicilor nr. 2, Cluj-Napoca, România',
        buildingCode: 'LIB' 
    },
    'Research Database': { 
        lat: 46.7678, 
        lng: 23.6145, 
        address: 'Centrul de Resurse Digitale, Str. Clinicilor nr. 2, Cluj-Napoca, România',
        buildingCode: 'LIB'
    },
    'E-Book Collection': { 
        lat: 46.7678, 
        lng: 23.6145, 
        address: 'Colecția E-Book, Str. Clinicilor nr. 2, Cluj-Napoca, România',
        buildingCode: 'LIB' 
    },
    'Academic Journals': { 
        lat: 46.7678, 
        lng: 23.6145, 
        address: 'Jurnale Academice, Str. Clinicilor nr. 2, Cluj-Napoca, România',
        buildingCode: 'LIB' 
    },
    'Thesis Archive': { 
        lat: 46.7678, 
        lng: 23.6145, 
        address: 'Arhiva de Lucrări, Str. Clinicilor nr. 2, Cluj-Napoca, România',
        buildingCode: 'LIB' 
    },
    // Student Services and Centers
    'Student Center': { 
        lat: 46.7689, 
        lng: 23.6178, 
        address: 'Centrul Studențesc, Str. Emil Isac nr. 20, Cluj-Napoca, România',
        buildingCode: 'SC' 
    },
    'Career Center': { 
        lat: 46.7701, 
        lng: 23.6167, 
        address: 'Centrul de Carieră, Str. Horea nr. 7, Cluj-Napoca, România',
        buildingCode: 'CC' 
    },
    'International Office': { 
        lat: 46.7723, 
        lng: 23.6198, 
        address: 'Biroul Relații Internaționale, Str. Republicii nr. 41, Cluj-Napoca, România',
        buildingCode: 'IO' 
    },
    // Equipment
    'Portable Whiteboard': { 
        lat: 46.7712, 
        lng: 23.6236, 
        address: 'Depozit Echipamente, Str. Constantin Daicoviciu nr. 15, Cluj-Napoca, România',
        buildingCode: 'MAIN' 
    },
    'Interactive Smartboard': { 
        lat: 46.7689, 
        lng: 23.6156, 
        address: 'Centrul de Tehnologie Educațională, Str. Donath nr. 103-105, Cluj-Napoca, România',
        buildingCode: 'RES' 
    },
    'Presentation Clicker': { 
        lat: 46.7698, 
        lng: 23.6189, 
        address: 'Echipamente Prezentare, Str. Memorandumului nr. 28, Cluj-Napoca, România',
        buildingCode: 'AC'
    },
    'Video Camera': { 
        lat: 46.7701, 
        lng: 23.6178, 
        address: 'Studiourile Media, Str. Emil Isac nr. 15, Cluj-Napoca, România',
        buildingCode: 'MEDIA' 
    },
    'Microphone Set': { 
        lat: 46.7701, 
        lng: 23.6178, 
        address: 'Echipamente Audio, Str. Emil Isac nr. 15, Cluj-Napoca, România',
        buildingCode: 'MEDIA' 
    },
    'Laptop Cart': { 
        lat: 46.7689, 
        lng: 23.6156, 
        address: 'Depozit Laptopuri, Str. Donath nr. 103-105, Cluj-Napoca, România',
        buildingCode: 'RES'
    },
    'Projector': { 
        lat: 46.7734, 
        lng: 23.6267, 
        address: 'Echipamente Proiecție, Str. George Barițiu nr. 25, Cluj-Napoca, România',
        buildingCode: 'IE' 
    },
    'VR Headset': { 
        lat: 46.7723, 
        lng: 23.6201, 
        address: 'Laboratorul VR/AR, Str. Republicii nr. 37, Cluj-Napoca, România',
        buildingCode: 'RES'
    },
    // Advanced Equipment
    '3D Printer': { 
        lat: 46.7723, 
        lng: 23.6201, 
        address: 'FabLab Cluj, Str. Republicii nr. 37, Cluj-Napoca, România',
        buildingCode: 'RES'
    },
    'Laser Cutter': { 
        lat: 46.7723, 
        lng: 23.6201, 
        address: 'Atelier Digital, Str. Republicii nr. 37, Cluj-Napoca, România',
        buildingCode: 'RES' 
    },
    'Electronics Kit': { 
        lat: 46.7718, 
        lng: 23.6198, 
        address: 'Laboratorul de Electronică, Str. Croitorilor nr. 2, Cluj-Napoca, România',
        buildingCode: 'IE' 
    },
    'Robotics Kit': { 
        lat: 46.7742, 
        lng: 23.6289, 
        address: 'Laboratorul de Robotică, Bd. Muncii nr. 103-105, Cluj-Napoca, România',
        buildingCode: 'FM' 
    },
    'Arduino Development Kit': { 
        lat: 46.7706, 
        lng: 23.6234, 
        address: 'Laboratorul de Dezvoltare, Str. Memorandumului nr. 28, Cluj-Napoca, România',
        buildingCode: 'AC' 
    },
    'Raspberry Pi Kit': { 
        lat: 46.7706, 
        lng: 23.6234, 
        address: 'Laboratorul IoT, Str. Memorandumului nr. 28, Cluj-Napoca, România',
        buildingCode: 'AC' 
    },
    // Collaboration Spaces
    'Virtual Meeting Room 1': { 
        lat: 46.7701, 
        lng: 23.6178, 
        address: 'Sala Virtuală 1, Str. Emil Isac nr. 15, Cluj-Napoca, România',
        buildingCode: 'MEDIA' 
    },
    'Virtual Meeting Room 2': { 
        lat: 46.7701, 
        lng: 23.6178, 
        address: 'Sala Virtuală 2, Str. Emil Isac nr. 15, Cluj-Napoca, România',
        buildingCode: 'MEDIA' 
    },
    'Breakout Room A': { 
        lat: 46.7689, 
        lng: 23.6178, 
        address: 'Sala de Lucru A, Str. Emil Isac nr. 20, Cluj-Napoca, România',
        buildingCode: 'SC' 
    },
    'Breakout Room B': { 
        lat: 46.7689, 
        lng: 23.6178, 
        address: 'Sala de Lucru B, Str. Emil Isac nr. 20, Cluj-Napoca, România',
        buildingCode: 'SC' 
    },
    'Innovation Hub': { 
        lat: 46.7723, 
        lng: 23.6201, 
        address: 'Hub de Inovație, Str. Republicii nr. 37, Cluj-Napoca, România',
        buildingCode: 'RES' 
    },
    // Study Aids
    'Noise-Cancelling Headphones': { 
        lat: 46.7678, 
        lng: 23.6145, 
        address: 'Centrul de Împrumut, Str. Clinicilor nr. 2, Cluj-Napoca, România',
        buildingCode: 'LIB' 
    },
    'Standing Desk Converter': { 
        lat: 46.7689, 
        lng: 23.6178, 
        address: 'Mobilier Ergonomic, Str. Emil Isac nr. 20, Cluj-Napoca, România',
        buildingCode: 'LIB' 
    },
    'Book Scanner': { 
        lat: 46.7678, 
        lng: 23.6145, 
        address: 'Servicii Digitizare, Str. Clinicilor nr. 2, Cluj-Napoca, România',
        buildingCode: 'LIB' 
    },
    'Graphics Tablet': { 
        lat: 46.7689, 
        lng: 23.6156, 
        address: 'Echipamente Design, Str. Donath nr. 103-105, Cluj-Napoca, România',
        buildingCode: 'RES' 
    },
    'Scientific Calculator': { 
        lat: 46.7698, 
        lng: 23.6189, 
        address: 'Echipamente Matematică, Str. Memorandumului nr. 28, Cluj-Napoca, România',
        buildingCode: 'AC' 
    },
    // Administrative Buildings
    'Rectorat UTCN': { 
        lat: 46.7712, 
        lng: 23.6236, 
        address: 'Rectorat UTCN, Str. Constantin Daicoviciu nr. 15, Cluj-Napoca, România',
        buildingCode: 'ADMIN-RECT'
    },
    'Decanatul Facultății de Construcții': { 
        lat: 46.7694, 
        lng: 23.6213, 
        address: 'Decanatul FC, Str. Constantin Daicoviciu nr. 15, Cluj-Napoca, România',
        buildingCode: 'ADMIN-FC'
    },
    'Secretariat General': { 
        lat: 46.7708, 
        lng: 23.6232, 
        address: 'Secretariat General, Str. Constantin Daicoviciu nr. 15, Cluj-Napoca, România',
        buildingCode: 'ADMIN-SEC'
    },

    // Residential Buildings
    'Căminul Studențesc T1': { 
        lat: 46.7756, 
        lng: 23.6298, 
        address: 'Căminul T1, Str. Observatorului nr. 34, Cluj-Napoca, România',
        buildingCode: 'RES-T1'
    },
    'Căminul Studențesc T2': { 
        lat: 46.7760, 
        lng: 23.6305, 
        address: 'Căminul T2, Str. Observatorului nr. 36, Cluj-Napoca, România',
        buildingCode: 'RES-T2'
    },
    'Căminul Studențesc Observator': { 
        lat: 46.7765, 
        lng: 23.6315, 
        address: 'Căminul Observator, Str. Observatorului nr. 40, Cluj-Napoca, România',
        buildingCode: 'RES-OBS'
    },

    // Recreational Buildings
    'Sala de Sport UTCN': { 
        lat: 46.7720, 
        lng: 23.6245, 
        address: 'Sala de Sport, Str. Constantin Daicoviciu nr. 17, Cluj-Napoca, România',
        buildingCode: 'REC-SPORT'
    },
    'Centrul Cultural Studențesc': { 
        lat: 46.7730, 
        lng: 23.6270, 
        address: 'Centrul Cultural, Str. George Barițiu nr. 23, Cluj-Napoca, România',
        buildingCode: 'REC-CULT'
    },
    'Teren de Sport Exterior': { 
        lat: 46.7725, 
        lng: 23.6250, 
        address: 'Teren Sport Exterior, Str. Constantin Daicoviciu nr. 19, Cluj-Napoca, România',
        buildingCode: 'REC-FIELD'
    },

    // Medical Buildings
    'Dispensarul Medical UTCN': { 
        lat: 46.7715, 
        lng: 23.6240, 
        address: 'Dispensar Medical, Str. Constantin Daicoviciu nr. 19, Cluj-Napoca, România',
        buildingCode: 'MED-DISP'
    },
    'Centrul de Sănătate Mentală': { 
        lat: 46.7700, 
        lng: 23.6195, 
        address: 'Centrul Sănătate Mentală, Str. Memorandumului nr. 30, Cluj-Napoca, România',
        buildingCode: 'MED-PSY'
    },

    // Online/Virtual Resources (no physical location)
    'Online': null,
    'Microsoft Office 365': null,
    'Adobe Creative Suite': null,
    'MATLAB': null,
    'AutoCAD': null,
    'SPSS Statistics': null,
    'Tableau': null,
    'PowerPoint Templates Pack': null,
    'Research Paper Template': null,
    'Thesis LaTeX Template': null,
    'Project Proposal Template': null,
    'Lab Report Template': null,
    'Presentation Poster Template': null,
    'Video Tutorial Library': null,
    'Course Notes Repository': null,
    'Practice Exam Bank': null,
    'Interactive Simulations': null,
    'Coding Playground': null
};

class ClujUniversityMapsService {
    // Campus-specific information
    static campusInfo = {
        name: 'Universitatea Tehnică din Cluj-Napoca',
        shortName: 'UTCN',
        mainAddress: 'Str. Constantin Daicoviciu nr. 15, Cluj-Napoca, România',
        phone: '+40 264 401200',
        website: 'https://www.utcluj.ro',
        coordinates: { lat: 46.7712, lng: 23.6236 }
    };

    // Get all buildings from API
    static async getAllBuildings() {
        try {
            const response = await fetch(API_CONFIG.getApiUrl('/buildings'));
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const buildings = await response.json();
            console.log('✅ Buildings loaded from API:', buildings.length);
            return buildings;
        } catch (error) {
            console.warn('⚠️ Failed to load buildings from API, using fallback:', error.message);
            return this.getFallbackBuildings();    
        }
    }

        static async getBuildingDetails(buildingCode) {
        try {
            console.log(`🏢 Loading building details for: ${buildingCode}`);
            const response = await fetch(API_CONFIG.getApiUrl(`/buildings/${buildingCode}`));
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const buildingDetails = await response.json();
            console.log(`✅ Building details loaded for ${buildingCode}`);
            return buildingDetails;
        } catch (error) {
            console.warn(`⚠️ Failed to load building details for ${buildingCode}:`, error.message);
            return this.getFallbackBuildingDetails(buildingCode);
        }
    }

    // Fallback building details when API is unavailable
    static getFallbackBuildingDetails(buildingCode) {
        const fallbackBuildings = {
            'MAIN': {
                id: 1,
                name: 'Clădirea Principală',
                code: 'MAIN',
                address: 'Str. Constantin Daicoviciu nr. 15, Cluj-Napoca, România',
                latitude: 46.7712,
                longitude: 23.6236,
                building_type: 'academic',
                floors: 4,
                capacity: 2000,
                description: 'Clădirea principală a Universității Tehnice din Cluj-Napoca',
                amenities: {
                    wifi: true,
                    parking: true,
                    cafeteria: true,
                    library: true,
                    computer_lab: true
                },
                opening_hours: {
                    monday: '07:00-22:00',
                    tuesday: '07:00-22:00',
                    wednesday: '07:00-22:00',
                    thursday: '07:00-22:00',
                    friday: '07:00-22:00',
                    saturday: '08:00-18:00',
                    sunday: 'closed'
                },
                contact_info: {
                    phone: '+40 264 401200',
                    email: 'info@utcluj.ro',
                    website: 'https://www.utcluj.ro'
                },
                accessibility_features: {
                    wheelchair_accessible: true,
                    elevator: true,
                    audio_signals: true,
                    braille_signs: true
                },
                emergency_info: {
                    evacuation_routes: 4,
                    fire_exits: 8,
                    emergency_contact: '+40 264 401111'
                },
                image_urls: [],
                transport_access: [],
                nearby_parking: []
            },
            'AC': {
                id: 2,
                name: 'Facultatea de Automatică și Calculatoare',
                code: 'AC',
                address: 'Str. Memorandumului nr. 28, Cluj-Napoca, România',
                latitude: 46.7698,
                longitude: 23.6189,
                building_type: 'academic',
                floors: 5,
                capacity: 1500,
                description: 'Facultatea de Automatică și Calculatoare - una dintre cele mai moderne facultăți din universitate',
                amenities: {
                    wifi: true,
                    parking: true,
                    computer_lab: true,
                    research_labs: true,
                    study_rooms: true
                },
                opening_hours: {
                    monday: '07:00-22:00',
                    tuesday: '07:00-22:00',
                    wednesday: '07:00-22:00',
                    thursday: '07:00-22:00',
                    friday: '07:00-22:00',
                    saturday: '08:00-16:00',
                    sunday: 'closed'
                },
                contact_info: {
                    phone: '+40 264 401775',
                    email: 'secretariat@cs.utcluj.ro',
                    website: 'https://www.cs.utcluj.ro'
                },
                accessibility_features: {
                    wheelchair_accessible: true,
                    elevator: true,
                    audio_signals: true
                },
                image_urls: [],
                transport_access: [],
                nearby_parking: []
            },
            'IE': {
                id: 3,
                name: 'Facultatea de Inginerie Electrică',
                code: 'IE',
                address: 'Str. Croitorilor nr. 2, Cluj-Napoca, România',
                latitude: 46.7718,
                longitude: 23.6198,
                building_type: 'academic',
                floors: 4,
                capacity: 1200,
                description: 'Facultatea de Inginerie Electrică - specializări în electronică, telecomunicații și energetică',
                amenities: {
                    wifi: true,
                    parking: true,
                    electronics_lab: true,
                    research_labs: true,
                    cafeteria: true
                },
                opening_hours: {
                    monday: '07:00-20:00',
                    tuesday: '07:00-20:00',
                    wednesday: '07:00-20:00',
                    thursday: '07:00-20:00',
                    friday: '07:00-20:00',
                    saturday: '08:00-14:00',
                    sunday: 'closed'
                },
                contact_info: {
                    phone: '+40 264 401234',
                    email: 'secretariat@ethz.utcluj.ro'
                },
                accessibility_features: {
                    wheelchair_accessible: true,
                    elevator: true
                },
                image_urls: [],
                transport_access: [],
                nearby_parking: []
            },
            'RES': {
                id: 4,
                name: 'Centrul de Cercetare și Inovare',
                code: 'RES',
                address: 'Str. Republicii nr. 37, Cluj-Napoca, România',
                latitude: 46.7723,
                longitude: 23.6201,
                building_type: 'research',
                floors: 3,
                capacity: 500,
                description: 'Centrul de Cercetare și Inovare - laboratoare avansate și proiecte de cercetare',
                amenities: {
                    wifi: true,
                    parking: true,
                    research_labs: true,
                    conference_rooms: true,
                    innovation_hub: true
                },
                opening_hours: {
                    monday: '08:00-18:00',
                    tuesday: '08:00-18:00',
                    wednesday: '08:00-18:00',
                    thursday: '08:00-18:00',
                    friday: '08:00-18:00',
                    saturday: 'by_appointment',
                    sunday: 'closed'
                },
                contact_info: {
                    phone: '+40 264 401567',
                    email: 'research@utcluj.ro'
                },
                accessibility_features: {
                    wheelchair_accessible: true,
                    elevator: true
                },
                image_urls: [],
                transport_access: [],
                nearby_parking: []
            },
            'LIB': {
                id: 5,
                name: 'Biblioteca Centrală Universitară',
                code: 'LIB',
                address: 'Str. Clinicilor nr. 2, Cluj-Napoca, România',
                latitude: 46.7678,
                longitude: 23.6145,
                building_type: 'library',
                floors: 6,
                capacity: 800,
                description: 'Biblioteca Centrală Universitară - cea mai mare bibliotecă tehnică din Transilvania',
                amenities: {
                    wifi: true,
                    study_rooms: true,
                    computer_access: true,
                    printing: true,
                    quiet_zones: true,
                    group_study_areas: true
                },
                opening_hours: {
                    monday: '08:00-20:00',
                    tuesday: '08:00-20:00',
                    wednesday: '08:00-20:00',
                    thursday: '08:00-20:00',
                    friday: '08:00-20:00',
                    saturday: '09:00-15:00',
                    sunday: '09:00-15:00'
                },
                contact_info: {
                    phone: '+40 264 598520',
                    email: 'biblioteca@utcluj.ro'
                },
                accessibility_features: {
                    wheelchair_accessible: true,
                    elevator: true,
                    audio_signals: true,
                    large_print_materials: true
                },
                image_urls: [],
                transport_access: [],
                nearby_parking: []
            },
            'ADMIN-RECT': {
                id: 6,
                name: 'Rectorat UTCN',
                code: 'ADMIN-RECT',
                address: 'Str. Constantin Daicoviciu nr. 15, Cluj-Napoca, România',
                latitude: 46.7712,
                longitude: 23.6236,
                building_type: 'administrative',
                floors: 3,
                capacity: 200,
                description: 'Clădirea Rectoratului - sediul administrației centrale a universității',
                amenities: { wifi: true, ac: true, meeting_rooms: true, reception: true },
                opening_hours: { weekdays: '08:00-16:00', saturday: 'closed', sunday: 'closed' },
                contact_info: { phone: '+40 264 401200', email: 'rectorat@utcluj.ro' },
                accessibility_features: { wheelchair_access: true, elevator: true },
                transport_access: [],
                nearby_parking: []
            },
            'ADMIN-FC': {
                id: 7,
                name: 'Decanatul Facultății de Construcții',
                code: 'ADMIN-FC',
                address: 'Str. Constantin Daicoviciu nr. 15, Cluj-Napoca, România',
                latitude: 46.7694,
                longitude: 23.6213,
                building_type: 'administrative',
                floors: 2,
                capacity: 100,
                description: 'Decanatul și secretariatul Facultății de Construcții',
                amenities: { wifi: true, ac: true, meeting_rooms: true, student_services: true },
                opening_hours: { weekdays: '08:00-16:00', friday: '08:00-14:00' },
                contact_info: { phone: '+40 264 401300', email: 'decanat.fc@utcluj.ro' },
                accessibility_features: { wheelchair_access: true, ramp_access: true },
                transport_access: [],
                nearby_parking: []
            },
            'ADMIN-SEC': {
                id: 8,
                name: 'Secretariat General',
                code: 'ADMIN-SEC',
                address: 'Str. Constantin Daicoviciu nr. 15, Cluj-Napoca, România',
                latitude: 46.7708,
                longitude: 23.6232,
                building_type: 'administrative',
                floors: 2,
                capacity: 80,
                description: 'Secretariatul general al universității',
                amenities: { wifi: true, ac: true, student_services: true },
                opening_hours: { weekdays: '08:00-16:00', friday: '08:00-14:00' },
                contact_info: { phone: '+40 264 401210', email: 'secretariat@utcluj.ro' },
                accessibility_features: { wheelchair_access: true, elevator: true },
                transport_access: [],
                nearby_parking: []
            },
            // Residential Buildings
            'RES-T1': {
                id: 9,
                name: 'Căminul Studențesc T1',
                code: 'RES-T1',
                address: 'Str. Observatorului nr. 34, Cluj-Napoca, România',
                latitude: 46.7756,
                longitude: 23.6298,
                building_type: 'residential',
                floors: 10,
                capacity: 400,
                description: 'Cămin studențesc modern cu camere pentru 2-3 persoane',
                amenities: { wifi: true, laundry: true, common_kitchen: true, study_rooms: true, gym: true },
                opening_hours: { weekdays: '24/7', weekend: '24/7' },
                contact_info: { phone: '+40 264 596342', email: 'camine@utcluj.ro' },
                accessibility_features: { wheelchair_access: true, elevator: true },
                transport_access: [],
                nearby_parking: []
            },
            'RES-T2': {
                id: 10,
                name: 'Căminul Studențesc T2',
                code: 'RES-T2',
                address: 'Str. Observatorului nr. 36, Cluj-Napoca, România',
                latitude: 46.7760,
                longitude: 23.6305,
                building_type: 'residential',
                floors: 10,
                capacity: 380,
                description: 'Cămin studențesc renovat cu facilități moderne',
                amenities: { wifi: true, laundry: true, common_kitchen: true, study_rooms: true },
                opening_hours: { weekdays: '24/7', weekend: '24/7' },
                contact_info: { phone: '+40 264 596343', email: 'camine@utcluj.ro' },
                accessibility_features: { wheelchair_access: true, elevator: true },
                transport_access: [],
                nearby_parking: []
            },
            'RES-OBS': {
                id: 11,
                name: 'Căminul Studențesc Observator',
                code: 'RES-OBS',
                address: 'Str. Observatorului nr. 40, Cluj-Napoca, România',
                latitude: 46.7765,
                longitude: 23.6315,
                building_type: 'residential',
                floors: 8,
                capacity: 300,
                description: 'Cămin studențesc cu vedere spre Observatorul Astronomic',
                amenities: { wifi: true, laundry: true, common_kitchen: true, terrace: true },
                opening_hours: { weekdays: '24/7', weekend: '24/7' },
                contact_info: { phone: '+40 264 596344', email: 'camine@utcluj.ro' },
                accessibility_features: { wheelchair_access: false, ground_floor_access: true },
                transport_access: [],
                nearby_parking: []
            },
            // Recreational Buildings
            'REC-SPORT': {
                id: 12,
                name: 'Sala de Sport UTCN',
                code: 'REC-SPORT',
                address: 'Str. Constantin Daicoviciu nr. 17, Cluj-Napoca, România',
                latitude: 46.7720,
                longitude: 23.6245,
                building_type: 'recreational',
                floors: 2,
                capacity: 500,
                description: 'Sala de sport principală a universității',
                amenities: { basketball_court: true, volleyball_court: true, fitness_room: true },
                opening_hours: { weekdays: '06:00-22:00', weekend: '08:00-20:00' },
                contact_info: { phone: '+40 264 401400', email: 'sport@utcluj.ro' },
                accessibility_features: { wheelchair_access: true, ramp_access: true },
                transport_access: [],
                nearby_parking: []
            },
            'REC-CULT': {
                id: 13,
                name: 'Centrul Cultural Studențesc',
                code: 'REC-CULT',
                address: 'Str. George Barițiu nr. 23, Cluj-Napoca, România',
                latitude: 46.7730,
                longitude: 23.6270,
                building_type: 'recreational',
                floors: 3,
                capacity: 300,
                description: 'Centrul cultural pentru activități artistice',
                amenities: { theater_hall: true, music_rooms: true, art_studio: true },
                opening_hours: { weekdays: '08:00-22:00', saturday: '10:00-20:00' },
                contact_info: { phone: '+40 264 401500', email: 'cultural@utcluj.ro' },
                accessibility_features: { wheelchair_access: true, elevator: true },
                transport_access: [],
                nearby_parking: []
            },
            'REC-FIELD': {
                id: 14,
                name: 'Teren de Sport Exterior',
                code: 'REC-FIELD',
                address: 'Str. Constantin Daicoviciu nr. 19, Cluj-Napoca, România',
                latitude: 46.7725,
                longitude: 23.6250,
                building_type: 'recreational',
                floors: 1,
                capacity: 200,
                description: 'Teren de sport exterior cu pistă de alergare',
                amenities: { football_field: true, basketball_court: true, running_track: true },
                opening_hours: { weekdays: '06:00-22:00', weekend: '07:00-21:00' },
                contact_info: { phone: '+40 264 401401', email: 'sport@utcluj.ro' },
                accessibility_features: { wheelchair_access: true, ramp_access: true },
                transport_access: [],
                nearby_parking: []
            },
            // Medical Buildings
            'MED-DISP': {
                id: 15,
                name: 'Dispensarul Medical UTCN',
                code: 'MED-DISP',
                address: 'Str. Constantin Daicoviciu nr. 19, Cluj-Napoca, România',
                latitude: 46.7715,
                longitude: 23.6240,
                building_type: 'medical',
                floors: 2,
                capacity: 80,
                description: 'Dispensarul medical universitar',
                amenities: { general_medicine: true, dental_care: true, pharmacy: true },
                opening_hours: { weekdays: '08:00-16:00', weekend: 'emergency_only' },
                contact_info: { phone: '+40 264 401235', email: 'dispensar@utcluj.ro' },
                accessibility_features: { wheelchair_access: true, ramp_access: true },
                transport_access: [],
                nearby_parking: []
            },
            'MED-PSY': {
                id: 16,
                name: 'Centrul de Sănătate Mentală',
                code: 'MED-PSY',
                address: 'Str. Memorandumului nr. 30, Cluj-Napoca, România',
                latitude: 46.7700,
                longitude: 23.6195,
                building_type: 'medical',
                floors: 1,
                capacity: 40,
                description: 'Centrul de consiliere psihologică',
                amenities: { counseling_rooms: true, group_therapy_room: true },
                opening_hours: { weekdays: '08:00-18:00', weekend: 'by_appointment' },
                contact_info: { phone: '+40 264 401600', email: 'psihologie@utcluj.ro' },
                accessibility_features: { wheelchair_access: true, accessible_entrance: true },
                transport_access: [],
                nearby_parking: []
            }
        };

        const building = fallbackBuildings[buildingCode] || fallbackBuildings['MAIN'];
        console.log(`📋 Using fallback data for building: ${buildingCode}`);
        return building;
    }

    // Get transport info for a building
    static async getTransportInfo(buildingCode, includeRealTime = false) {
        try {
            const url = `${API_CONFIG.getApiUrl('/transport')}/${buildingCode}${includeRealTime ? '?includeRealTime=true' : ''}`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const transportInfo = await response.json();
            console.log(`✅ Transport info loaded for ${buildingCode}`);
            return transportInfo;
        } catch (error) {
            console.warn(`⚠️ Failed to load transport info for ${buildingCode}:`, error.message);
            return this.getFallbackTransportInfo(buildingCode);
        }
    }
    // Get parking info for a building
    static async getParkingInfo(buildingCode, radiusMeters = 1000) {
        try {
            const url = `${API_CONFIG.getApiUrl('/parking')}/${buildingCode}?radius=${radiusMeters}`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const parkingInfo = await response.json();
            console.log(`✅ Parking info loaded for ${buildingCode}`);
            return parkingInfo;
        } catch (error) {
            console.warn(`⚠️ Failed to load parking info for ${buildingCode}:`, error.message);
            return this.getFallbackParkingInfo(buildingCode);
        }
    }
    // Get directions between two buildings
    static async getDirections(fromBuildingCode, toBuildingCode, mode = 'walking') {
        try {
            const url = `${API_CONFIG.getApiUrl('/directions')}/${fromBuildingCode}/${toBuildingCode}?mode=${mode}`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const directions = await response.json();
            console.log(`✅ Directions loaded: ${fromBuildingCode} → ${toBuildingCode}`);
            return directions;
        } catch (error) {
            console.warn(`⚠️ Failed to load directions:`, error.message);
            return this.getFallbackDirections(fromBuildingCode, toBuildingCode, mode);
        }
    }

    // Get location coordinates and address
    static async getLocationCoordinates(location) {
        const staticLocation = locationMap[location];
        if (staticLocation && staticLocation.buildingCode) {
            try {
                const buildingDetails = await this.getBuildingDetails(staticLocation.buildingCode);

                return {
                    lat:buildingDetails.latitude,
                    lng: buildingDetails.longitude,
                    address: buildingDetails.address,
                    buildingCode: buildingDetails.code,
                    buildingName: buildingDetails.name,
                    buildingInfo: buildingDetails 
                };
            } catch (error) {
                console.warn('Using static location data as fallback');
            }
        }
        // Fallback to static data
        return staticLocation || { 
            lat: 46.7712, 
            lng: 23.6236, 
            address: location || 'UTCN Campus, Cluj-Napoca, România',
            buildingCode: 'MAIN'
        };
    }

    // Public transportation options in Cluj-Napoca
    static async getPublicTransportInfo(destination, buildingCode = null) {
        if (buildingCode) {
            try {
                const transportInfo = await this.getTransportInfo(buildingCode, true);
                return {
                    building: transportInfo.building,
                    availableTransport: transportInfo.available_transport,
                    generalInfo: transportInfo.general_info,
                    realTimeAvailable: !!transportInfo.real_time_note
                };
            } catch (error) {
                console.warn('Using static transport data as fallback');   
            }
        }
        // Fallback to static data
        return this.getStaticPublicTransportInfo(destination);
    }
    // Parking info
    static async getParkingInfoEnhanced(destination, buildingCode = null){
        if (buildingCode) {
            try {
                const parkingInfo = await this.getParkingInfo(buildingCode);
                return parkingInfo.parking_areas;
            } catch (error) {
                console.warn('Using static parking data as fallback');
            }
        }
        return this.getStaticParkingInfo(destination);
    }

    static getFallbackBuildings() {
        return [
            // Academic Buildings
            {
                id: 1,
                name: 'Clădirea Centrală UTCN',
                code: 'MAIN',
                address: 'Str. Constantin Daicoviciu nr. 15, Cluj-Napoca',
                latitude: 46.7712,
                longitude: 23.6236,
                building_type: 'academic',
                floors: 4,
                capacity: 500,
                amenities: { wifi: true, ac: true, elevator: true, cafeteria: true },
                opening_hours: { weekdays: '07:00-21:00', saturday: '08:00-16:00', sunday: 'closed' }
            },
            {
                id: 2,
                name: 'Facultatea de Automatică și Calculatoare',
                code: 'AC',
                address: 'Str. Memorandumului nr. 28, Cluj-Napoca',
                latitude: 46.7706,
                longitude: 23.6234,
                building_type: 'academic',
                floors: 5,
                capacity: 800,
                amenities: { wifi: true, ac: true, computer_labs: true, study_rooms: true },
                opening_hours: { weekdays: '07:00-22:00', saturday: '08:00-18:00', sunday: '09:00-17:00' }
            },
            {
                id: 3,
                name: 'Facultatea de Inginerie Electrică',
                code: 'IE',
                address: 'Str. Croitorilor nr. 2, Cluj-Napoca',
                latitude: 46.7718,
                longitude: 23.6198,
                building_type: 'academic',
                floors: 4,
                capacity: 600,
                amenities: { wifi: true, ac: true, specialized_labs: true, workshop: true },
                opening_hours: { weekdays: '07:00-21:00', saturday: '08:00-16:00', sunday: 'closed' }
            },

            // Research Buildings
            {
                id: 4,
                name: 'Centrul de Cercetare și Inovare',
                code: 'RES',
                address: 'Str. Republicii nr. 37, Cluj-Napoca',
                latitude: 46.7723,
                longitude: 23.6201,
                building_type: 'research',
                floors: 3,
                capacity: 200,
                amenities: { wifi: true, ac: true, '3d_printers': true, laser_cutter: true, vr_lab: true },
                opening_hours: { weekdays: '08:00-20:00', saturday: '09:00-17:00', sunday: 'closed' }
            },

            // Library Buildings
            {
                id: 5,
                name: 'Biblioteca Centrală Universitară',
                code: 'LIB',
                address: 'Str. Clinicilor nr. 2, Cluj-Napoca',
                latitude: 46.7678,
                longitude: 23.6145,
                building_type: 'library',
                floors: 6,
                capacity: 1000,
                amenities: { wifi: true, ac: true, study_rooms: true, computer_access: true, printing: true },
                opening_hours: { weekdays: '08:00-22:00', saturday: '09:00-20:00', sunday: '10:00-18:00' }
            },

            // Administrative Buildings
            {
                id: 6,
                name: 'Rectorat UTCN',
                code: 'ADMIN-RECT',
                address: 'Str. Constantin Daicoviciu nr. 15, Cluj-Napoca',
                latitude: 46.7712,
                longitude: 23.6236,
                building_type: 'administrative',
                floors: 3,
                capacity: 200,
                amenities: { wifi: true, ac: true, meeting_rooms: true, reception: true, parking: true, elevator: true },
                opening_hours: { weekdays: '08:00-16:00', saturday: 'closed', sunday: 'closed' }
            },
            {
                id: 7,
                name: 'Decanatul Facultății de Construcții',
                code: 'ADMIN-FC',
                address: 'Str. Constantin Daicoviciu nr. 15, Cluj-Napoca',
                latitude: 46.7694,
                longitude: 23.6213,
                building_type: 'administrative',
                floors: 2,
                capacity: 100,
                amenities: { wifi: true, ac: true, meeting_rooms: true, student_services: true, printing: true },
                opening_hours: { weekdays: '08:00-16:00', friday: '08:00-14:00', saturday: 'closed', sunday: 'closed' }
            },
            {
                id: 8,
                name: 'Secretariat General',
                code: 'ADMIN-SEC',
                address: 'Str. Constantin Daicoviciu nr. 15, Cluj-Napoca',
                latitude: 46.7708,
                longitude: 23.6232,
                building_type: 'administrative',
                floors: 2,
                capacity: 80,
                amenities: { wifi: true, ac: true, student_services: true, document_center: true, waiting_area: true },
                opening_hours: { weekdays: '08:00-16:00', friday: '08:00-14:00', saturday: 'closed', sunday: 'closed' }
            },

            // Residential Buildings
            {
                id: 9,
                name: 'Căminul Studențesc T1',
                code: 'RES-T1',
                address: 'Str. Observatorului nr. 34, Cluj-Napoca',
                latitude: 46.7756,
                longitude: 23.6298,
                building_type: 'residential',
                floors: 10,
                capacity: 400,
                amenities: { wifi: true, laundry: true, common_kitchen: true, study_rooms: true, gym: true, parking: true, security: true, elevator: true },
                opening_hours: { weekdays: '24/7', weekend: '24/7' }
            },
            {
                id: 10,
                name: 'Căminul Studențesc T2',
                code: 'RES-T2',
                address: 'Str. Observatorului nr. 36, Cluj-Napoca',
                latitude: 46.7760,
                longitude: 23.6305,
                building_type: 'residential',
                floors: 10,
                capacity: 380,
                amenities: { wifi: true, laundry: true, common_kitchen: true, study_rooms: true, common_room: true, parking: true, security: true, elevator: true },
                opening_hours: { weekdays: '24/7', weekend: '24/7' }
            },
            {
                id: 11,
                name: 'Căminul Studențesc Observator',
                code: 'RES-OBS',
                address: 'Str. Observatorului nr. 40, Cluj-Napoca',
                latitude: 46.7765,
                longitude: 23.6315,
                building_type: 'residential',
                floors: 8,
                capacity: 300,
                amenities: { wifi: true, laundry: true, common_kitchen: true, study_rooms: true, terrace: true, parking: true, security: true },
                opening_hours: { weekdays: '24/7', weekend: '24/7' }
            },

            // Recreational Buildings
            {
                id: 12,
                name: 'Sala de Sport UTCN',
                code: 'REC-SPORT',
                address: 'Str. Constantin Daicoviciu nr. 17, Cluj-Napoca',
                latitude: 46.7720,
                longitude: 23.6245,
                building_type: 'recreational',
                floors: 2,
                capacity: 500,
                amenities: { basketball_court: true, volleyball_court: true, badminton_court: true, fitness_room: true, locker_rooms: true, showers: true, parking: true },
                opening_hours: { weekdays: '06:00-22:00', saturday: '08:00-20:00', sunday: '08:00-20:00' }
            },
            {
                id: 13,
                name: 'Centrul Cultural Studențesc',
                code: 'REC-CULT',
                address: 'Str. George Barițiu nr. 23, Cluj-Napoca',
                latitude: 46.7730,
                longitude: 23.6270,
                building_type: 'recreational',
                floors: 3,
                capacity: 300,
                amenities: { theater_hall: true, music_rooms: true, art_studio: true, exhibition_space: true, sound_system: true, stage: true, parking: true },
                opening_hours: { weekdays: '08:00-22:00', saturday: '10:00-20:00', sunday: 'closed' }
            },
            {
                id: 14,
                name: 'Teren de Sport Exterior',
                code: 'REC-FIELD',
                address: 'Str. Constantin Daicoviciu nr. 19, Cluj-Napoca',
                latitude: 46.7725,
                longitude: 23.6250,
                building_type: 'recreational',
                floors: 1,
                capacity: 200,
                amenities: { football_field: true, basketball_court: true, running_track: true, outdoor_gym: true, lighting: true, changing_rooms: true },
                opening_hours: { weekdays: '06:00-22:00', weekend: '07:00-21:00' }
            },

            // Medical Buildings
            {
                id: 15,
                name: 'Dispensarul Medical UTCN',
                code: 'MED-DISP',
                address: 'Str. Constantin Daicoviciu nr. 19, Cluj-Napoca',
                latitude: 46.7715,
                longitude: 23.6240,
                building_type: 'medical',
                floors: 2,
                capacity: 80,
                amenities: { general_medicine: true, dental_care: true, pharmacy: true, emergency_care: true, lab_tests: true, x_ray: true, parking: true },
                opening_hours: { weekdays: '08:00-16:00', friday: '08:00-14:00', saturday: 'emergency_only', sunday: 'emergency_only' }
            },
            {
                id: 16,
                name: 'Centrul de Sănătate Mentală',
                code: 'MED-PSY',
                address: 'Str. Memorandumului nr. 30, Cluj-Napoca',
                latitude: 46.7700,
                longitude: 23.6195,
                building_type: 'medical',
                floors: 1,
                capacity: 40,
                amenities: { counseling_rooms: true, group_therapy_room: true, relaxation_room: true, wifi: true, ac: true, parking: true },
                opening_hours: { weekdays: '08:00-18:00', friday: '08:00-16:00', saturday: 'by_appointment', sunday: 'emergency_only' }
            }
        ];
    }

    static getFallbackBuildingDetails(buildingCode) {
        const buildings = this.getFallbackBuildings();
        const building = buildings.find(b => b.code === buildingCode);

        if (!building) {
            return null;
        }

        return {
            ...building,
            amenities: { wifi: true, ac: true },
            opening_hours: { weekdays: '07:00-21:00', saturday: '08:00-16:00' },
            contact_info: { phone: '+40 264 401200' },
            accessibility_features: { wheelchair_access: true },
            transport_access: [],
            nearby_parking: []
        };
    }

    static getFallbackTransportInfo(buildingCode) {
        return {
            building: { code: buildingCode },
            available_transport: {
                bus: [
                    {
                        route_number: '4',
                        route_name: 'Linia 4 - Grigorescu - Mănăștur',
                        operator: 'CTP Cluj-Napoca',
                        walking_time_minutes: 2
                    }
                ]
            },
            general_info: {
                ticket_prices: {
                    single_ride: '2.5 RON',
                    monthly_student: '50 RON'
                }
            }
        };
    }

    static getFallbackParkingInfo(buildingCode) {
        return [
            {
                name: 'Parcare UTCN Campus Central',
                parking_type: 'permit_only',
                total_spaces: 120,
                walking_time_minutes: 2,
                cost: 'Gratuit cu permis UTCN'
            }
        ];
    }

    static getFallbackDirections(fromCode, toCode, mode) {
        return {
            from: { code: fromCode },
            to: { code: toCode },
            travel_mode: mode,
            estimated_time_minutes: 15,
            distance_km: 1.2,
            instructions: `Traseu ${mode} de la ${fromCode} la ${toCode}`
        };
    }

      static getStaticPublicTransportInfo(destination) {
    const busRoutes = {
      'Str. Constantin Daicoviciu': ['Linia 4', 'Linia 4B', 'Linia 20'],
      'Str. Memorandumului': ['Linia 5', 'Linia 20', 'Linia 21'],
      'Str. George Barițiu': ['Linia 24', 'Linia 25'],
      'Bd. Muncii': ['Linia 3', 'Linia 3B', 'Linia 35'],
      'Str. Clinicilor': ['Linia 24', 'Linia 26', 'Linia 35']
    };

    const streetName = destination.split(',')[0];
    const routes = busRoutes[streetName] || ['Verifică aplicația CTP Cluj'];
    
    return {
      availableRoutes: routes,
      ticketPrice: '2.5 RON',
      monthlyPass: '50 RON (studenți)',
      ctpWebsite: 'https://www.ctpcj.ro',
      mobileApp: 'CTP Cluj-Napoca (Android/iOS)'
    };
  }

  static getCampusShuttleInfo() {
    return {
      available: true,
      routes: [
        'Campus Central ↔ Facultatea de Automatică',
        'Campus Central ↔ Bibliotecă Centrală',
        'Campus Central ↔ Cămine Studențești'
      ],
      schedule: 'Luni-Vineri: 08:00-18:00',
      frequency: 'La fiecare 15 minute',
      cost: 'Gratuit pentru studenți UTCN'
    };
  }

    static getStaticParkingInfo(destination) {
        return [
            {
                name: 'Parcare UTCN - Campus Central',
                type: 'Parcare facultate',
                capacity: 120,
                cost: 'Gratuit cu permis UTCN',
                walkTime: '2 minute',
                restrictions: 'Doar personal și studenți'
            },
            {
                name: 'Parcare Strada Daicoviciu',
                type: 'Parcare publică',
                capacity: 50,
                cost: '2 RON/oră',
                walkTime: '3 minute',
                restrictions: 'Program: 08:00-18:00'
            },
            {
                name: 'Parcare Piața Cipariu',
                type: 'Parcare cu plată',
                capacity: 200,
                cost: '3 RON/oră',
                walkTime: '8 minute',
                restrictions: '24/7 disponibil'
            }
        ];
    }

    static getEmergencyInfo() {
        return {
            university: {
                security: '+40 264 401234',
                medical: 'Dispensarul UTCN: +40 264 401235',
                administration: '+40 264 401200'
            },
            cityServices: {
                police: '112',
                medical: '112',
                fire: '112',
                localPolice: '+40 264 596999'
            },
            hospitals: [
                {
                    name: 'Spitalul Clinic Județean Cluj',
                    address: 'Str. Clinicilor nr. 3-5',
                    phone: '+40 264 597852',
                    distance: '1.2 km de campus'
                },
                {
                    name: 'Spitalul de Urgență Cluj',
                    address: 'Str. Dimitrie Cantemir nr. 4',
                    phone: '+40 264 207500',
                    distance: '2.1 km de campus'
                }
            ]
        };
    }

    static getStudentServices() {
        return [
            {
                name: 'Secretariat Studenți',
                location: 'Clădirea A, etajul 1',
                hours: 'L-V: 08:00-16:00',
                services: ['Înmatriculări', 'Certificate', 'Transferuri'],
                contact: '+40 264 401245'
            },
            {
                name: 'Centrul de Cariere',
                location: 'Clădirea B, etajul 2',
                hours: 'L-V: 09:00-17:00',
                services: ['Consiliere carieră', 'Stagii de practică', 'Job fair'],
                contact: '+40 264 401267'
            },
            {
                name: 'Biblioteca Centrală',
                location: 'Str. Clinicilor nr. 2',
                hours: 'L-V: 08:00-20:00, S-D: 09:00-15:00',
                services: ['Împrumut cărți', 'Acces baze de date', 'Săli de studiu'],
                contact: '+40 264 598520'
            },
            {
                name: 'Cămine Studențești',
                location: 'Str. Observatorului',
                hours: '24/7',
                services: ['Cazare studenți', 'Cămine', 'Cantină'],
                contact: '+40 264 596342'
            }
        ];
    }

    static getDirectionsText(from, to, mode = 'walking') {
        const modeText = {
            walking: 'pe jos',
            driving: 'cu mașina',
            transit: 'cu transportul public',
            bicycling: 'cu bicicleta'
        };

        return {
            from: from,
            to: to,
            mode: modeText[mode],
            instruction: `Traseu ${modeText[mode]} de la ${from} la ${to}`,
            openInMaps: `Deschide în Google Maps`,
            shareLocation: `Trimite locația`,
            estimatedTime: this.getEstimatedTime(from, to, mode)
        };
    }

    static getEstimatedTime(from, to, mode) {
        const baseTimes = {
            walking: 15,
            driving: 8,
            transit: 20,
            bicycling: 10
        };

        return {
            time: baseTimes[mode] || 15,
            unit: 'minute',
            text: `Aproximativ ${baseTimes[mode] || 15} minute`
        };
    }

    // UTILITY METHODS
    // Check if API is available
    static async checkApiAvailability() {
        try {
            const response = await fetch(API_CONFIG.getApiUrl('/buildings'), { 
                method: 'HEAD',
                timeout: 5000 
            });
            return response.ok;
        } catch (error) {
            console.warn('API not available, using static data');
            return false;
        }
    }

    // Get building code from location name
    static getBuildingCodeFromLocation(location) {
        const staticLocation = locationMap[location];
        return staticLocation?.buildingCode || 'MAIN';
    }

    // Calculate distance between two coordinates
    static calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
}

export default ClujUniversityMapsService;