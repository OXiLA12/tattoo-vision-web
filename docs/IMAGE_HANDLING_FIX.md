# Image Handling Fix: Blob URLs → Data URLs

## Problem Summary

When navigating from the upload step to the editor step, images would sometimes appear as blank/black in the editor canvas. This happened because:

1. **Blob URLs are temporary** - Created with `URL.createObjectURL(file)`, they're tied to the document lifecycle
2. **Blob URLs get revoked** - When components unmount or navigate, blob URLs can become invalid
3. **Silent failures** - `<img src="blob:...">` fails silently when the blob is no longer available
4. **No persistence** - Blob URLs can't be stored in localStorage or survive page refreshes

## Root Cause

Blob URLs are memory references that the browser can garbage collect. When you:
- Navigate between pages/components
- Unmount components that created the blob
- Hot reload during development
- Store the URL in state and re-render

...the blob URL may become invalid, causing images to fail to load.

## Solution Implemented

We've converted all image handling to use **persistent base64 data URLs** instead of blob URLs.

### What Changed

#### 1. Enhanced `imageUtils.ts` with new utilities:

```typescript
// Convert File to data URL
export async function fileToDataURL(file: File): Promise<string>

// Convert any URL (blob, http, etc.) to data URL
export async function urlToDataURL(url: string): Promise<string>

// Load image from URL and return ImageData with data URL
export async function loadImageFromUrl(url: string): Promise<ImageData>
```

#### 2. Updated `loadImageWithOrientation()` 
Already correctly converts to data URLs! This function:
- Takes a File object
- Handles EXIF orientation
- Resizes if needed (max 2048px)
- Returns a data URL in the ImageData object

#### 3. Updated `History.tsx`
- Now converts Supabase storage URLs to data URLs when loading history items
- Uses `loadImageFromUrl()` utility

#### 4. Updated `Library.tsx`
- Now converts Supabase storage URLs to data URLs when selecting tattoos
- Uses `loadImageFromUrl()` utility

## How It Works

### Upload Flow
```
User selects file
    ↓
loadImageWithOrientation(file)
    ↓
Creates blob URL temporarily
    ↓
Draws to canvas with orientation correction
    ↓
Exports as data URL (base64)
    ↓
Revokes blob URL
    ↓
Returns persistent data URL
```

### History/Library Flow
```
User clicks history/library item
    ↓
loadImageFromUrl(supabaseUrl)
    ↓
urlToDataURL() loads image
    ↓
Draws to canvas
    ↓
Exports as data URL (base64)
    ↓
Returns persistent data URL
```

### Editor Flow
```
Receives ImageData with data URL
    ↓
Creates <img> element with data URL
    ↓
Image loads reliably (data URLs never expire)
    ↓
User can drag/scale/rotate
    ↓
Works across navigation
```

## Benefits

✅ **Persistent** - Data URLs never expire or get revoked
✅ **Reliable** - Works across component mounts/unmounts
✅ **Storable** - Can be saved in localStorage if needed
✅ **Portable** - Can be sent to server or downloaded
✅ **Consistent** - Same format everywhere in the app

## Trade-offs

⚠️ **Memory** - Data URLs are larger than blob URLs (base64 encoding adds ~33% overhead)
⚠️ **Size** - Large images create large strings in memory
⚠️ **Performance** - Initial conversion takes time (but only once)

### Mitigation
- Images are resized to max 2048px before conversion
- JPEG quality set to 0.85 for good balance
- Only converted once per image
- Blob URLs still used temporarily during conversion (then revoked)

## Best Practices Going Forward

### ✅ DO:
- Use `loadImageWithOrientation()` for all file uploads
- Use `loadImageFromUrl()` for loading from Supabase/external URLs
- Store data URLs in React state
- Use data URLs in `<img>` elements
- Compress/resize images before converting to data URLs

### ❌ DON'T:
- Store blob URLs in state
- Pass blob URLs between components
- Use blob URLs after component unmount
- Forget to revoke blob URLs if you create them temporarily
- Convert extremely large images without resizing first

## Example Usage

### Uploading a file:
```typescript
const handleFileUpload = async (file: File) => {
  const imageData = await loadImageWithOrientation(file);
  setBodyImage(imageData); // imageData.url is a data URL
};
```

### Loading from Supabase:
```typescript
const handleLoadFromHistory = async (item: HistoryItem) => {
  const bodyData = await loadImageFromUrl(item.body_image_url);
  const tattooData = await loadImageFromUrl(item.tattoo_image_url);
  setBodyImage(bodyData);
  setTattooImage(tattooData);
};
```

### Using in components:
```typescript
// This works reliably across navigation
<img src={bodyImage.url} alt="Body" />
```

## Testing Checklist

- [x] Upload image → navigate to editor → image displays
- [x] Load from history → image displays in editor
- [x] Select from library → image displays in editor
- [x] Drag/scale/rotate works correctly
- [x] Navigate back and forth → images persist
- [x] Hot reload during development → images still work
- [x] Export functionality works

## Technical Details

### Data URL Format
```
data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBD...
```

- `data:` - Protocol
- `image/jpeg` - MIME type
- `base64` - Encoding
- `,` - Separator
- `...` - Base64 encoded image data

### Size Comparison
- Original file: 2MB
- Blob URL: ~50 bytes (`blob:http://localhost:5173/abc-123`)
- Data URL: ~2.7MB (base64 encoding adds ~33%)

But data URLs are **persistent and reliable**, which is worth the trade-off for this use case.

## Future Improvements

If memory becomes an issue with very large images:

1. **IndexedDB Storage** - Store File objects in IndexedDB, convert to data URLs only when needed
2. **Lazy Loading** - Convert to data URL only when component mounts
3. **Progressive Loading** - Show low-res preview first, load full-res on demand
4. **Server Storage** - Upload to Supabase immediately, use signed URLs

For now, the data URL approach provides the best balance of simplicity and reliability.
