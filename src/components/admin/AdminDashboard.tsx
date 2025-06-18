import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Loader } from '@googlemaps/js-api-loader';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import ContentEditable from 'react-contenteditable';
import AdminPromotions from './AdminPromotions';
import AdminProducts from './AdminProducts';
import AdminSettings from './AdminSettings';
import AdminAddons from './AdminAddons';
import {
  LogOut,
  Image,
  Edit3,
  DollarSign,
  Plus,
  Trash2,
  Save,
  X,
  Layout,
  MapPin,
  FileText,
  Settings,
  Eye,
  Upload,
  AlertCircle,
  Undo2,
  Calendar,
  Clock,
  ToggleLeft,
  ToggleRight,
  History,
  Download,
  Package,
  Tag
} from 'lucide-react';

// Types
interface SiteContent {
  hero: {
    title: string;
    subtitle: string;
    backgroundImage: string;
  };
  about: {
    title: string;
    description: string;
    history: string;
    values: string[];
    images: string[];
  };
  contact: {
    address: string;
    phone: string;
    email: string;
    workingHours: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
}

interface ActivityLog {
  id: number;
  userId: string;
  action: string;
  timestamp: Date;
  details: string;
}

// Initial state
const initialSiteContent: SiteContent = {
  hero: {
    title: "Açaí House o melhor da região Oeste!",
    subtitle: "Deliciosas combinações de açaí com as melhores frutas e complementos",
    backgroundImage: "https://images.unsplash.com/photo-1596463059283-da257325bab8?auto=format&fit=crop&q=80"
  },
  about: {
    title: "Sobre a Açaí House",
    description: "Transformando momentos em memórias deliciosas, um açaí de cada vez",
    history: "Fundada em 2020, a Açaí House nasceu do sonho de trazer para a região Oeste de Belo Horizonte uma experiência única com o autêntico açaí amazônico.",
    values: [
      "Qualidade Premium",
      "Atendimento Especial",
      "Feito com Amor",
      "Entrega Rápida"
    ],
    images: [
      "https://images.unsplash.com/photo-1596463119248-53c8d33d2739?auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1596463119298-3e5d8d8b4001?auto=format&fit=crop&q=80"
    ]
  },
  contact: {
    address: "Av. Silva Lobo, 1234 - Nova Granada, Belo Horizonte - MG, 30431-262",
    phone: "(31) 99999-9999",
    email: "contato@acaihouse.com.br",
    workingHours: "Segunda a Sábado: 11h - 22h\nDomingo: 12h - 20h",
    coordinates: {
      lat: -19.9269624,
      lng: -43.9771463
    }
  }
};

const AUTOSAVE_DELAY = 3000; // 3 seconds

export default function AdminDashboard() {
  const { logout, user } = useAuth();
  const [activeSection, setActiveSection] = useState<'content' | 'products' | 'promotions' | 'addons' | 'location' | 'settings'>('content');
  const [siteContent, setSiteContent] = useState<SiteContent>(initialSiteContent);
  const [contentHistory, setContentHistory] = useState<SiteContent[]>([initialSiteContent]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout>();

  // Initialize Google Maps with Places Autocomplete
  useEffect(() => {
    if (activeSection === 'location' && !mapRef.current && mapContainerRef.current) {
      const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      if (!googleMapsApiKey || googleMapsApiKey === 'YOUR_ACTUAL_GOOGLE_MAPS_API_KEY') {
        console.warn('Google Maps API key not configured. Please set VITE_GOOGLE_MAPS_API_KEY in your .env file.');
        setErrorMessage('Google Maps API key not configured. Please contact administrator.');
        return;
      }

      const loader = new Loader({
        apiKey: googleMapsApiKey,
        version: 'weekly',
        libraries: ['places']
      });

      loader.load().then(() => {
        const map = new google.maps.Map(mapContainerRef.current!, {
          center: siteContent.contact.coordinates,
          zoom: 15
        });

        const marker = new google.maps.Marker({
          position: siteContent.contact.coordinates,
          map: map,
          draggable: true
        });

        // Initialize Places Autocomplete
        const input = document.getElementById('address-input') as HTMLInputElement;
        const autocomplete = new google.maps.places.Autocomplete(input);
        
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.geometry) {
            const location = {
              lat: place.geometry.location?.lat() || 0,
              lng: place.geometry.location?.lng() || 0
            };
            
            map.setCenter(location);
            marker.setPosition(location);
            
            setSiteContent(prev => ({
              ...prev,
              contact: {
                ...prev.contact,
                address: place.formatted_address || prev.contact.address,
                coordinates: location
              }
            }));
            setHasUnsavedChanges(true);
            logActivity('Updated location');
          }
        });

        marker.addListener('dragend', () => {
          const position = marker.getPosition()!;
          setSiteContent(prev => ({
            ...prev,
            contact: {
              ...prev.contact,
              coordinates: {
                lat: position.lat(),
                lng: position.lng()
              }
            }
          }));
          setHasUnsavedChanges(true);
          logActivity('Updated marker location');
        });

        mapRef.current = map;
      }).catch((error) => {
        console.error('Error loading Google Maps:', error);
        setErrorMessage('Error loading Google Maps. Please check your API key configuration.');
      });
    }
  }, [activeSection]);

  // Auto-save functionality
  useEffect(() => {
    if (hasUnsavedChanges) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      
      autoSaveTimerRef.current = setTimeout(() => {
        handleSave(true);
      }, AUTOSAVE_DELAY);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [siteContent, hasUnsavedChanges]);

  // Activity logging
  const logActivity = (action: string, details: string = '') => {
    const newLog: ActivityLog = {
      id: Date.now(),
      userId: user?.username || 'unknown',
      action,
      timestamp: new Date(),
      details
    };
    setActivityLogs(prev => [newLog, ...prev]);
  };

  // Handle file upload with preview
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadProgress(0);
      
      // Simulate file upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev === null || prev >= 100) {
            clearInterval(interval);
            return null;
          }
          return prev + 10;
        });
      }, 200);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        // Update content based on upload type
        if (type === 'hero-background') {
          setSiteContent(prev => ({
            ...prev,
            hero: { ...prev.hero, backgroundImage: reader.result as string }
          }));
        } else if (type.startsWith('about-image')) {
          const index = parseInt(type.split('-')[2]);
          setSiteContent(prev => ({
            ...prev,
            about: {
              ...prev.about,
              images: prev.about.images.map((img, i) => 
                i === index ? reader.result as string : img
              )
            }
          }));
        }
        
        setHasUnsavedChanges(true);
        logActivity('Uploaded image', `Type: ${type}`);
        
        // Clear progress after upload
        clearInterval(interval);
        setUploadProgress(null);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading file:', error);
      setErrorMessage('Error uploading file. Please try again.');
      setUploadProgress(null);
    }
  };

  // Handle drag and drop for values reordering
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(siteContent.about.values);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSiteContent(prev => ({
      ...prev,
      about: { ...prev.about, values: items }
    }));
    setHasUnsavedChanges(true);
    logActivity('Reordered values');
  };

  // Handle inline editing
  const handleInlineEdit = (
    section: keyof SiteContent,
    field: string,
    value: string
  ) => {
    setSiteContent(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    setHasUnsavedChanges(true);
    logActivity('Updated content', `${section}.${field}`);
  };

  // Undo/Redo functionality
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setSiteContent(contentHistory[historyIndex - 1]);
      logActivity('Undid changes');
    }
  };

  const handleRedo = () => {
    if (historyIndex < contentHistory.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setSiteContent(contentHistory[historyIndex + 1]);
      logActivity('Redid changes');
    }
  };

  // Save changes
  const handleSave = async (isAutoSave: boolean = false) => {
    if (!hasUnsavedChanges) return;

    if (!isAutoSave) {
      const confirmSave = window.confirm('Tem certeza que deseja salvar as alterações?');
      if (!confirmSave) return;
    }

    try {
      // Here you would typically make API calls to save the changes
      console.log('Saving changes:', {
        siteContent
      });

      // Add to history
      setContentHistory(prev => [...prev.slice(0, historyIndex + 1), siteContent]);
      setHistoryIndex(prev => prev + 1);

      setHasUnsavedChanges(false);
      setSuccessMessage(isAutoSave ? 'Alterações salvas automaticamente!' : 'Alterações salvas com sucesso!');
      logActivity('Saved changes', isAutoSave ? 'Auto-save' : 'Manual save');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error saving changes:', error);
      setErrorMessage('Erro ao salvar alterações. Tente novamente.');
      
      // Clear error message after 3 seconds
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // Navigation menu items
  const menuItems = [
    { id: 'content', label: 'Conteúdo', icon: Layout },
    { id: 'products', label: 'Produtos', icon: Package },
    { id: 'promotions', label: 'Promoções', icon: FileText },
    { id: 'addons', label: 'Acréscimos', icon: Tag },
    { id: 'location', label: 'Localização', icon: MapPin },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Painel Administrativo
              </h1>
              <span className="ml-4 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                {user?.role}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              {hasUnsavedChanges && (
                <div className="flex items-center text-amber-600">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <span className="text-sm">Alterações não salvas</span>
                </div>
              )}
              
              {/* Undo/Redo buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleUndo}
                  disabled={historyIndex === 0}
                  className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                  title="Desfazer"
                >
                  <Undo2 className="h-5 w-5" />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={historyIndex === contentHistory.length - 1}
                  className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                  title="Refazer"
                >
                  <History className="h-5 w-5" />
                </button>
              </div>

              <button
                onClick={() => setPreviewMode(!previewMode)}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                <Eye className="h-5 w-5 mr-2" />
                {previewMode ? 'Editar' : 'Visualizar'}
              </button>
              
              <button
                onClick={() => handleSave(false)}
                disabled={!hasUnsavedChanges}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-5 w-5 mr-2" />
                Salvar
              </button>
              
              <button
                onClick={logout}
                className="flex items-center px-4 py-2 text-red-600 hover:text-red-700"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50">
          {successMessage}
        </div>
      )}
      
      {errorMessage && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          {errorMessage}
        </div>
      )}

      {/* Upload Progress */}
      {uploadProgress !== null && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-white p-4 rounded-lg shadow-lg z-50">
          <div className="w-64">
            <div className="text-sm font-medium text-gray-700 mb-2">
              Uploading file...
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <nav className="w-64 bg-white rounded-lg shadow-lg p-4 h-fit">
            <ul className="space-y-2">
              {menuItems.map(item => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveSection(item.id as any)}
                    className={`w-full flex items-center px-4 py-2 rounded-lg transition ${
                      activeSection === item.id
                        ? 'bg-purple-100 text-purple-800'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Content Area */}
          <div className="flex-1 bg-white rounded-lg shadow-lg p-6">
            {/* Content Section */}
            {activeSection === 'content' && (
              <div className="space-y-8">
                <h2 className="text-xl font-semibold mb-6">Gerenciar Conteúdo do Site</h2>
                
                {/* Hero Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Seção Principal (Hero)</h3>
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Título Principal
                      </label>
                      <ContentEditable
                        html={siteContent.hero.title}
                        onChange={(e) => handleInlineEdit('hero', 'title', e.target.value)}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        disabled={previewMode}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subtítulo
                      </label>
                      <ContentEditable
                        html={siteContent.hero.subtitle}
                        onChange={(e) => handleInlineEdit('hero', 'subtitle', e.target.value)}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        disabled={previewMode}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Imagem de Fundo
                      </label>
                      <div className="flex items-center space-x-4">
                        <div
                          className="relative flex-1 p-2 border rounded-lg cursor-pointer hover:bg-gray-50"
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragging(true);
                          }}
                          onDragLeave={() => setIsDragging(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDragging(false);
                            const file = e.dataTransfer.files[0];
                            if (file && file.type.startsWith('image/')) {
                              const input = fileInputRef.current;
                              if (input) {
                                const dataTransfer = new DataTransfer();
                                dataTransfer.items.add(file);
                                input.files = dataTransfer.files;
                                handleFileUpload({ target: input } as any, 'hero-background');
                              }
                            }
                          }}
                        >
                          <input
                            type="text"
                            value={siteContent.hero.backgroundImage}
                            onChange={(e) => handleInlineEdit('hero', 'backgroundImage', e.target.value)}
                            className="w-full bg-transparent"
                            disabled={previewMode}
                          />
                          {isDragging && (
                            <div className="absolute inset-0 bg-purple-100 bg-opacity-50 flex items-center justify-center rounded-lg">
                              <p className="text-purple-600 font-medium">Solte a imagem aqui</p>
                            </div>
                          )}
                        </div>
                        <label className="flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-lg cursor-pointer hover:bg-purple-200">
                          <Upload className="h-5 w-5 mr-2" />
                          Upload
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, 'hero-background')}
                            disabled={previewMode}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* About Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Seção Sobre</h3>
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Título
                      </label>
                      <ContentEditable
                        html={siteContent.about.title}
                        onChange={(e) => handleInlineEdit('about', 'title', e.target.value)}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        disabled={previewMode}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descrição
                      </label>
                      <ContentEditable
                        html={siteContent.about.description}
                        onChange={(e) => handleInlineEdit('about', 'description', e.target.value)}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[100px]"
                        disabled={previewMode}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        História
                      </label>
                      <ContentEditable
                        html={siteContent.about.history}
                        onChange={(e) => handleInlineEdit('about', 'history', e.target.value)}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[150px]"
                        disabled={previewMode}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valores
                      </label>
                      <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="values">
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className="space-y-2"
                            >
                              {siteContent.about.values.map((value, index) => (
                                <Draggable
                                  key={index}
                                  draggableId={`value-${index}`}
                                  index={index}
                                  isDragDisabled={previewMode}
                                >
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className="flex items-center space-x-2 bg-white p-2 border rounded-lg"
                                    >
                                      <ContentEditable
                                        html={value}
                                        onChange={(e) => {
                                          const newValues = [...siteContent.about.values];
                                          newValues[index] = e.target.value;
                                          setSiteContent(prev => ({
                                            ...prev,
                                            about: { ...prev.about, values: newValues }
                                          }));
                                          setHasUnsavedChanges(true);
                                        }}
                                        className="flex-1 p-2"
                                        disabled={previewMode}
                                      />
                                      {!previewMode && (
                                        <button
                                          onClick={() => {
                                            const newValues = siteContent.about.values.filter((_, i) => i !== index);
                                            setSiteContent(prev => ({
                                              ...prev,
                                              about: { ...prev.about, values: newValues }
                                            }));
                                            setHasUnsavedChanges(true);
                                            logActivity('Removed value');
                                          }}
                                          className="p-2 text-red-500 hover:text-red-700"
                                        >
                                          <Trash2 className="h-5 w-5" />
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>
                      {!previewMode && (
                        <button
                          onClick={() => {
                            setSiteContent(prev => ({
                              ...prev,
                              about: {
                                ...prev.about,
                                values: [...prev.about.values, 'Novo Valor']
                              }
                            }));
                            setHasUnsavedChanges(true);
                            logActivity('Added new value');
                          }}
                          className="flex items-center px-4 py-2 text-purple-600 hover:text-purple-700 mt-2"
                        >
                          <Plus className="h-5 w-5 mr-2" />
                          Adicionar Valor
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Products Section */}
            {activeSection === 'products' && <AdminProducts />}

            {/* Promotions Section */}
            {activeSection === 'promotions' && <AdminPromotions />}

            {/* Addons Section */}
            {activeSection === 'addons' && <AdminAddons />}

            {/* Settings Section */}
            {activeSection === 'settings' && <AdminSettings />}

            {/* Location Section */}
            {activeSection === 'location' && (
              <div className="space-y-8">
                <h2 className="text-xl font-semibold mb-6">Gerenciar Localização</h2>
                
                <div className="grid gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Endereço Completo
                    </label>
                    <input
                      id="address-input"
                      type="text"
                      value={siteContent.contact.address}
                      onChange={(e) => {
                        setSiteContent(prev => ({
                          ...prev,
                          contact: { ...prev.contact, address: e.target.value }
                        }));
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Digite o endereço para buscar..."
                      disabled={previewMode}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Telefone
                      </label>
                      <input
                        type="text"
                        value={siteContent.contact.phone}
                        onChange={(e) => {
                          setSiteContent(prev => ({
                            ...prev,
                            contact: { ...prev.contact, phone: e.target.value }
                          }));
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        disabled={previewMode}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        E-mail
                      </label>
                      <input
                        type="email"
                        value={siteContent.contact.email}
                        onChange={(e) => {
                          setSiteContent(prev => ({
                            ...prev,
                            contact: { ...prev.contact, email: e.target.value }
                          }));
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        disabled={previewMode}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Horário de Funcionamento
                    </label>
                    <textarea
                      value={siteContent.contact.workingHours}
                      onChange={(e) => {
                        setSiteContent(prev => ({
                          ...prev,
                          contact: { ...prev.contact, workingHours: e.target.value }
                        }));
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={4}
                      disabled={previewMode}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Localização no Mapa
                    </label>
                    <div
                      ref={mapContainerRef}
                      className="w-full h-[400px] rounded-lg overflow-hidden"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}