'use client';

import { useEffect, useState } from 'react';

type Product = {
  id: number;
  sku: string;
  name: string;
  description: string;
  unitCost: number;
  sellingPrice: number;
  reorderLevel: number;
  status: string;
  category: {
    id: number;
    name: string;
  };
  supplier: {
    id: number;
    name: string;
  } | null;
};

type Category = {
  id: number;
  name: string;
};

type Supplier = {
  id: number;
  name: string;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [loading, setLoading] = useState(true);

  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [reorderLevel, setReorderLevel] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [supplierId, setSupplierId] = useState('');

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');

  const [editingId, setEditingId] = useState<number | null>(null);

  const [message, setMessage] = useState('');

  const fetchProducts = () => {
    fetch('http://localhost:8080/api/products')
      .then((response) => response.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to fetch products:', error);
        setLoading(false);
      });
  };

  const fetchCategories = () => {
    fetch('http://localhost:8080/api/categories')
      .then((response) => response.json())
      .then((data) => {
        setCategories(data);
      })
      .catch((error) => {
        console.error('Failed to fetch categories:', error);
      });
  };

  const fetchSuppliers = () => {
    fetch('http://localhost:8080/api/suppliers')
      .then((response) => response.json())
      .then((data) => {
        setSuppliers(data);
      })
      .catch((error) => {
        console.error('Failed to fetch suppliers:', error);
      });
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchSuppliers();
  }, []);

  const clearForm = () => {
    setSku('');
    setName('');
    setDescription('');
    setUnitCost('');
    setSellingPrice('');
    setReorderLevel('');
    setCategoryId('');
    setSupplierId('');
    setEditingId(null);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      setMessage('Category name is required.');
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          description: newCategoryDescription.trim(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();

        console.error('Category creation failed:', errorText);
        setMessage(`Failed to create category: ${errorText}`);

        return;
      }

      const newCategory: Category = await response.json();

      setCategories((current) => [...current, newCategory]);

      setCategoryId(String(newCategory.id));

      setNewCategoryName('');
      setNewCategoryDescription('');
      setShowCategoryForm(false);

      setMessage('Category created successfully.');
    } catch (error) {
      console.error('Category creation failed:', error);
      setMessage('Failed to connect to the backend.');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');

    const productData = {
      sku,
      name,
      description,
      unitCost: Number(unitCost),
      sellingPrice: Number(sellingPrice),
      reorderLevel: Number(reorderLevel),
      status: 'ACTIVE',
      category: {
        id: Number(categoryId),
      },
      supplier: supplierId
        ? {
            id: Number(supplierId),
          }
        : null,
    };

    try {
      const url = editingId
        ? `http://localhost:8080/api/products/${editingId}`
        : 'http://localhost:8080/api/products';

      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorText = await response.text();

        console.error('Backend error:', errorText);
        setMessage(`Failed: ${errorText}`);

        return;
      }

      setMessage(
        editingId
          ? 'Product updated successfully.'
          : 'Product created successfully.',
      );

      clearForm();
      fetchProducts();
    } catch (error) {
      console.error('Request failed:', error);
      setMessage('Failed to connect to the backend.');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);

    setSku(product.sku);
    setName(product.name);
    setDescription(product.description || '');
    setUnitCost(String(product.unitCost));
    setSellingPrice(String(product.sellingPrice));
    setReorderLevel(String(product.reorderLevel));

    setCategoryId(String(product.category.id));

    setSupplierId(product.supplier ? String(product.supplier.id) : '');

    setMessage('');
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this product?',
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/products/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();

        console.error('Delete failed:', errorText);
        setMessage(`Delete failed: ${errorText}`);

        return;
      }

      setMessage('Product deleted successfully.');

      if (editingId === id) {
        clearForm();
      }

      fetchProducts();
    } catch (error) {
      console.error('Delete request failed:', error);
      setMessage('Failed to connect to the backend.');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold">Products</h1>

      <p className="mt-2 text-muted-foreground">
        Manage your products and pricing.
      </p>

      {/* Add / Edit Product Form */}
      <div className="mt-8 rounded-lg border p-6">
        <h2 className="text-xl font-semibold">
          {editingId ? 'Edit Product' : 'Add Product'}
        </h2>

        <form
          onSubmit={handleSubmit}
          className="mt-6 grid gap-4 md:grid-cols-2"
        >
          <div>
            <label className="text-sm font-medium">SKU</label>

            <input
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Name</label>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium">Description</label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2"
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Unit Cost</label>

            <input
              type="number"
              step="0.01"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Selling Price</label>

            <input
              type="number"
              step="0.01"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Reorder Level</label>

            <input
              type="number"
              value={reorderLevel}
              onChange={(e) => setReorderLevel(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Category</label>

              <button
                type="button"
                onClick={() => setShowCategoryForm(!showCategoryForm)}
                className="text-sm text-primary hover:underline"
              >
                {showCategoryForm ? 'Cancel' : '+ Add Category'}
              </button>
            </div>

            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2"
              required
            >
              <option value="">Select category</option>

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            {showCategoryForm && (
              <div className="mt-3 space-y-3 rounded-md border bg-muted/30 p-4">
                <input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Category name"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />

                <textarea
                  value={newCategoryDescription}
                  onChange={(e) => setNewCategoryDescription(e.target.value)}
                  placeholder="Description (optional)"
                  rows={2}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />

                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
                >
                  Add Category
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Supplier</label>

            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2"
            >
              <option value="">No supplier</option>

              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 md:col-span-2">
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
            >
              {editingId ? 'Update Product' : 'Add Product'}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={clearForm}
                className="rounded-md border px-4 py-2"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {message && (
          <p className="mt-4 text-sm text-muted-foreground">{message}</p>
        )}
      </div>

      {/* Product List */}
      <div className="mt-8 rounded-lg border">
        {loading ? (
          <p className="p-6 text-muted-foreground">Loading products...</p>
        ) : products.length === 0 ? (
          <p className="p-6 text-muted-foreground">No products found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-4">SKU</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Cost</th>
                  <th className="p-4">Selling Price</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b">
                    <td className="p-4">{product.sku}</td>

                    <td className="p-4">{product.name}</td>

                    <td className="p-4">৳{product.unitCost}</td>

                    <td className="p-4">৳{product.sellingPrice}</td>

                    <td className="p-4">{product.status}</td>

                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="rounded-md border px-3 py-1 text-sm"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(product.id)}
                          className="rounded-md border px-3 py-1 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
